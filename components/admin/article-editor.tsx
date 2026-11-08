"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useForm } from "react-hook-form";
import {
  Bold,
  Braces,
  Code2,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Save,
  Send,
  Undo2,
} from "lucide-react";
import { saveArticleAction } from "@/app/site-admin/articles/actions";
import { slugifyArticleTitle } from "@/lib/admin/article-schema";
import type { AdminArticle } from "@/lib/admin/articles";
import type { TiptapNode } from "@/lib/blog/types";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UrlDialog } from "@/components/admin/url-dialog";
import { formatArticleDateTime } from "@/lib/blog/format";

type EditorForm = {
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  tags: string;
  coverAssetId: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  externalUrl: string;
};

type EditorAsset = { id: string; display_name: string; alt_text: string | null };

const emptyDocument: TiptapNode = { type: "doc", content: [{ type: "paragraph" }] };

function ToolbarButton({ active, label, onClick, children }: { active?: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`inline-flex size-9 items-center justify-center rounded-lg transition ${active ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}>
      {children}
    </button>
  );
}

export function ArticleEditor({
  article,
  assets,
  adminPathPrefix,
  blogBaseUrl,
}: {
  article: AdminArticle | null;
  assets: EditorAsset[];
  adminPathPrefix: string;
  blogBaseUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishValues, setPublishValues] = useState<EditorForm | null>(null);
  const [urlDialog, setUrlDialog] = useState<{ kind: "link" | "image"; value: string } | null>(null);
  const savingRef = useRef(false);
  const savedArticleId = useRef(article?.id ?? null);
  const [articleDates, setArticleDates] = useState<{ publishedAt: string | null; updatedAt: string } | null>(article ? { publishedAt: article.published_at, updatedAt: article.updated_at } : null);
  const [publishStatus, setPublishStatus] = useState<
    { phase: "publishing" } | { phase: "success"; url: string; opened: boolean } | { phase: "error"; error: string } | null
  >(null);
  const publishing = publishStatus?.phase === "publishing";
  const [content, setContent] = useState<TiptapNode>(article?.content ?? emptyDocument);
  const [contentText, setContentText] = useState(article?.content_text ?? "");
  const existingTags = useMemo(() => article?.article_tags.flatMap((row) => row.tags?.name ? [row.tags.name] : []).join(", ") ?? "", [article]);
  const { register, handleSubmit, setValue, getValues, watch, formState: { isDirty } } = useForm<EditorForm>({
    defaultValues: {
      title: article?.title ?? "",
      slug: article?.slug ?? "",
      subtitle: article?.subtitle ?? "",
      excerpt: article?.excerpt ?? "",
      tags: existingTags,
      coverAssetId: article?.cover_asset_id ?? "",
      featured: article?.featured ?? false,
      seoTitle: article?.seo_title ?? "",
      seoDescription: article?.seo_description ?? "",
      canonicalUrl: article?.canonical_url ?? "",
      externalUrl: article?.external_url ?? "",
    },
  });
  const watchedValues = watch();
  const autosaveSignature = JSON.stringify({ values: watchedValues, content, contentText });
  const lastSavedSignature = useRef(autosaveSignature);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder: "Tell the story…" }),
      Image.configure({ allowBase64: false }),
    ],
    content: article?.content ?? emptyDocument,
    editorProps: { attributes: { class: "admin-tiptap-content" } },
    onUpdate: ({ editor: currentEditor }) => {
      setContent(currentEditor.getJSON() as TiptapNode);
      setContentText(currentEditor.getText({ blockSeparator: "\n" }));
    },
  });

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    setUrlDialog({ kind: "link", value: previous ?? "" });
  }

  function addImage() {
    if (!editor) return;
    setUrlDialog({ kind: "image", value: "" });
  }

  function actionInput(values: EditorForm, intent: "draft" | "publish" | "autosave") {
    return {
      id: savedArticleId.current,
      title: values.title,
      slug: values.slug || slugifyArticleTitle(values.title),
      subtitle: values.subtitle || null,
      excerpt: values.excerpt || null,
      content,
      contentText,
      coverAssetId: values.coverAssetId || null,
      featured: values.featured,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      canonicalUrl: values.canonicalUrl,
      externalUrl: values.externalUrl,
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      intent,
    } as const;
  }

  function submit(values: EditorForm, intent: "draft" | "publish") {
    if (savingRef.current) return;
    savingRef.current = true;
    setMessage(null);
    setSaveError(null);
    // Reserve the tab during the click so browsers allow navigation after the
    // asynchronous save. It only receives the article URL after a successful save.
    let publishedTab: Window | null = null;
    if (intent === "publish") {
      setPublishStatus({ phase: "publishing" });
      try {
        publishedTab = window.open("about:blank", "_blank");
        if (publishedTab) {
          publishedTab.opener = null;
          publishedTab.document.title = "Publishing your article…";
          publishedTab.document.body.textContent = "Publishing your article… This page will open the story once publishing succeeds.";
        }
      } catch {
        publishedTab = null;
      }
    }
    startTransition(async () => {
      try {
      const result = await saveArticleAction(actionInput(values, intent));

      if (!result.ok) {
        publishedTab?.close();
        setSaveError(result.error);
        if (intent === "publish") setPublishStatus({ phase: "error", error: result.error });
        return;
      }

      savedArticleId.current = result.id;
      setArticleDates({ publishedAt: result.publishedAt, updatedAt: result.updatedAt });
      lastSavedSignature.current = autosaveSignature;
      setMessage(intent === "publish" ? "Published." : "Draft saved.");
      if (intent === "publish") {
        const slug = (values.slug || slugifyArticleTitle(values.title)).trim();
        const url = new URL(encodeURIComponent(slug), blogBaseUrl.endsWith("/") ? blogBaseUrl : `${blogBaseUrl}/`).toString();
        let opened = false;
        try {
          if (publishedTab && !publishedTab.closed) {
            publishedTab.location.replace(url);
            opened = true;
          }
        } catch { /* The success dialog always offers a direct article link. */ }
        setPublishStatus({ phase: "success", url, opened });
        return;
      }
      if (!article) router.replace(`${adminPathPrefix}/articles/${result.id}`);
      router.refresh();
      } catch {
        publishedTab?.close();
        setSaveError("Unable to save. Check your connection and retry. Your article is still open here.");
        if (intent === "publish") setPublishStatus({ phase: "error", error: "Publishing could not be confirmed. Your content is still open here. Check your connection and retry." });
      } finally {
        savingRef.current = false;
      }
    });
  }

  useEffect(() => {
    if (publishValues || publishStatus || !article || article.status !== "draft" || autosaveSignature === lastSavedSignature.current) return;
    const values = getValues();
    if (!values.title.trim() || !(values.slug || slugifyArticleTitle(values.title))) return;

    const timer = window.setTimeout(() => {
      if (savingRef.current) return;
      savingRef.current = true;
      startTransition(async () => {
        try {
        const result = await saveArticleAction(actionInput(getValues(), "autosave"));
        if (result.ok) {
          setArticleDates({ publishedAt: result.publishedAt, updatedAt: result.updatedAt });
          setSaveError(null);
          lastSavedSignature.current = autosaveSignature;
          setMessage(`Autosaved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        } else {
          setSaveError(result.error);
        }
        } catch {
          setSaveError("Autosave failed. Your changes are still open here. Use Save draft to retry.");
        } finally {
          savingRef.current = false;
        }
      });
    }, 5000);

    return () => window.clearTimeout(timer);
    // actionInput is intentionally reconstructed from the latest form/editor state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article, autosaveSignature, content, contentText, getValues, startTransition, publishValues, publishStatus]);

  return (
    <>
    <form className="space-y-8" aria-busy={pending || publishing} onSubmit={handleSubmit((values) => submit(values, "draft"), () => setSaveError("Add a title and a valid slug before saving."))}>
      {articleDates ? <dl aria-label="Article dates" className="flex flex-wrap gap-x-8 gap-y-3 border-b border-neutral-200 pb-5 text-sm dark:border-neutral-800">
        <div><dt className="text-xs font-medium text-neutral-500">Last updated</dt><dd className="mt-1"><time dateTime={articleDates.updatedAt}>{formatArticleDateTime(articleDates.updatedAt)}</time></dd></div>
        <div><dt className="text-xs font-medium text-neutral-500">First published</dt><dd className="mt-1">{articleDates.publishedAt ? <time dateTime={articleDates.publishedAt}>{formatArticleDateTime(articleDates.publishedAt)}</time> : "Not published yet"}</dd></div>
      </dl> : null}
      {saveError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{saveError}</p> : null}
      <p role="status" className="text-sm text-neutral-500">{pending ? "Saving your article…" : message}</p>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <input
            {...register("title", {
              required: true,
              onChange: (event) => {
                if (!getValues("slug") || !article) setValue("slug", slugifyArticleTitle(event.target.value), { shouldDirty: true });
              },
            })}
            placeholder="Article title"
            className="w-full border-0 bg-transparent font-serif text-4xl font-medium tracking-[-0.035em] outline-none placeholder:text-neutral-300 sm:text-6xl dark:placeholder:text-neutral-700"
          />
          <input {...register("subtitle")} placeholder="A thoughtful subtitle (optional)" className="w-full border-0 bg-transparent text-xl text-neutral-600 outline-none placeholder:text-neutral-300 dark:text-neutral-300 dark:placeholder:text-neutral-700" />

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 p-2 dark:border-neutral-800">
              <ToolbarButton label="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolbarButton>
              <ToolbarButton label="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolbarButton>
              <ToolbarButton label="Heading 2" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Heading 3" active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Bullet list" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolbarButton>
              <ToolbarButton label="Numbered list" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolbarButton>
              <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolbarButton>
              <ToolbarButton label="Inline code" active={editor?.isActive("code")} onClick={() => editor?.chain().focus().toggleCode().run()}><Code2 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Code block" active={editor?.isActive("codeBlock")} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Braces className="size-4" /></ToolbarButton>
              <ToolbarButton label="Link" active={editor?.isActive("link")} onClick={setLink}><Link2 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Image URL" onClick={addImage}><ImageIcon className="size-4" /></ToolbarButton>
              <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
              <ToolbarButton label="Undo" onClick={() => editor?.chain().focus().undo().run()}><Undo2 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Redo" onClick={() => editor?.chain().focus().redo().run()}><Redo2 className="size-4" /></ToolbarButton>
            </div>
            {editor ? <EditorContent editor={editor} /> : <p role="status" className="flex min-h-64 items-center justify-center gap-2 text-neutral-500"><Loader2 className="size-4 animate-spin" /> Loading editor…</p>}
          </div>
          <p className="text-right text-xs text-neutral-500">{contentText.trim() ? contentText.trim().split(/\s+/).length : 0} words · {article?.status === "draft" ? "autosaves after 5 seconds" : "manual save"}</p>
        </div>

        <aside className="space-y-5">
          <section className="admin-panel">
            <h2 className="admin-panel-title">Story settings</h2>
            <label className="admin-field"><span>Slug</span><input {...register("slug", { required: true })} /></label>
            <label className="admin-field"><span>Excerpt</span><textarea {...register("excerpt")} rows={4} /></label>
            <label className="admin-field"><span>Tags</span><input {...register("tags")} placeholder="Next.js, Security, Java" /><small>Comma-separated; new tags are created automatically.</small></label>
            <label className="admin-field"><span>Cover image</span><select {...register("coverAssetId")}><option value="">No cover</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.display_name}</option>)}</select></label>
            <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" {...register("featured")} className="size-4" /> Feature on blog home</label>
          </section>

          <section className="admin-panel">
            <h2 className="admin-panel-title">SEO and distribution</h2>
            <label className="admin-field"><span>SEO title</span><input {...register("seoTitle")} /></label>
            <label className="admin-field"><span>SEO description</span><textarea {...register("seoDescription")} rows={3} /></label>
            <label className="admin-field"><span>Canonical URL</span><input {...register("canonicalUrl")} placeholder="https://…" /></label>
            <label className="admin-field"><span>External source URL</span><input {...register("externalUrl")} placeholder="https://…" /></label>
          </section>
        </aside>
      </div>

      <div className="sticky bottom-4 z-30 ml-auto flex w-fit items-center gap-3 rounded-full border border-neutral-200 bg-white/95 p-2 pl-4 shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
        <span role="status" className="text-xs text-neutral-500">{publishing ? "Publishing…" : pending ? "Saving…" : saveError ? "Save failed" : message ?? (isDirty ? "Unsaved changes" : article ? "Saved article" : "New draft")}</span>
        <button type="submit" disabled={pending || publishing} className="admin-secondary-button">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save draft
        </button>
        <button type="button" disabled={pending || publishing} onClick={handleSubmit((values) => setPublishValues(values), () => setSaveError("Add a title and a valid slug before publishing."))} className="admin-primary-button">
          {publishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {publishing ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
    <ConfirmDialog open={Boolean(publishValues)} onOpenChange={(open) => { if (!open) setPublishValues(null); }} confirmation={{ title: "Publish this story?", description: "Your current article content will become visible to everyone on your blog.", label: "Publish story" }} onConfirm={() => { if (publishValues) submit(publishValues, "publish"); setPublishValues(null); }} />
    <Dialog.Root open={Boolean(publishStatus)} onOpenChange={(open) => {
      if (open || publishing) return;
      const succeeded = publishStatus?.phase === "success";
      setPublishStatus(null);
      if (succeeded) {
        if (!article) router.replace(`${adminPathPrefix}/articles/${savedArticleId.current}`);
        router.refresh();
      }
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-neutral-950 shadow-xl dark:bg-neutral-900 dark:text-white" onEscapeKeyDown={(event) => { if (publishing) event.preventDefault(); }} onPointerDownOutside={(event) => { if (publishing) event.preventDefault(); }}>
          <Dialog.Title className="flex items-center gap-3 text-xl font-semibold">{publishing ? <Loader2 className="size-5 animate-spin" /> : null}{publishing ? "Publishing your article…" : publishStatus?.phase === "success" ? "Article published" : "Publishing failed"}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            {publishing ? "Please wait while your article is saved and published. The article will open in a new tab when it is ready." : publishStatus?.phase === "success" ? (publishStatus.opened ? "Your article is live and has opened in a new tab." : "Your article is live. Your browser blocked the new tab; use the link below to open it.") : publishStatus?.phase === "error" ? publishStatus.error : ""}
          </Dialog.Description>
          {publishing ? <p role="status" className="mt-4 text-sm">Publishing in progress…</p> : publishStatus?.phase === "error" ? <p role="alert" className="mt-4 text-sm text-red-600">Your content remains in the editor. Close this dialog to review it and retry.</p> : <p role="status" className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">Successfully published.</p>}
          {!publishing ? <div className="mt-6 flex flex-wrap justify-end gap-3"><Dialog.Close className="admin-secondary-button">Back to editor</Dialog.Close>{publishStatus?.phase === "success" ? <a className="admin-primary-button" href={publishStatus.url} target="_blank" rel="noopener noreferrer">Open published article</a> : null}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    {urlDialog ? <UrlDialog kind={urlDialog.kind} initialValue={urlDialog.value} onClose={() => setUrlDialog(null)} onSubmit={(url) => {
      if (urlDialog.kind === "image") editor?.chain().focus().setImage({ src: url }).run();
      else if (!url) editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      else editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      setUrlDialog(null);
    }} /> : null}
    </>
  );
}
