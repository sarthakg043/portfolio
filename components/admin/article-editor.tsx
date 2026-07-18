"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
}: {
  article: AdminArticle | null;
  assets: EditorAsset[];
  adminPathPrefix: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
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
    const url = window.prompt("HTTPS URL", previous ?? "https://");
    if (url === null) return;
    if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function addImage() {
    if (!editor) return;
    const url = window.prompt("Public image URL", "https://");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  function actionInput(values: EditorForm, intent: "draft" | "publish" | "autosave") {
    return {
      id: article?.id ?? null,
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
    setMessage(null);
    startTransition(async () => {
      const result = await saveArticleAction(actionInput(values, intent));

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      lastSavedSignature.current = autosaveSignature;
      setMessage(intent === "publish" ? "Published." : "Draft saved.");
      if (!article) router.replace(`${adminPathPrefix}/articles/${result.id}`);
      router.refresh();
    });
  }

  useEffect(() => {
    if (!article || article.status !== "draft" || autosaveSignature === lastSavedSignature.current) return;
    const values = getValues();
    if (!values.title.trim() || !(values.slug || slugifyArticleTitle(values.title))) return;

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await saveArticleAction(actionInput(getValues(), "autosave"));
        if (result.ok) {
          lastSavedSignature.current = autosaveSignature;
          setMessage(`Autosaved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        } else {
          setMessage(result.error);
        }
      });
    }, 5000);

    return () => window.clearTimeout(timer);
    // actionInput is intentionally reconstructed from the latest form/editor state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article, autosaveSignature, content, contentText, getValues, startTransition]);

  return (
    <form className="space-y-8" onSubmit={handleSubmit((values) => submit(values, "draft"))}>
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
            <EditorContent editor={editor} />
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
        <span className="hidden text-xs text-neutral-500 sm:inline">{message ?? (isDirty ? "Unsaved changes" : article ? "Saved article" : "New draft")}</span>
        <button type="submit" disabled={pending} className="admin-secondary-button">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save draft
        </button>
        <button type="button" disabled={pending} onClick={handleSubmit((values) => submit(values, "publish"))} className="admin-primary-button">
          <Send className="size-4" /> Publish
        </button>
      </div>
    </form>
  );
}
