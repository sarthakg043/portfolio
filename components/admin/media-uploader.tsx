"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { registerAssetAction } from "@/app/site-admin/media/actions";
import { createClient } from "@/lib/supabase/client";

const destinations = {
  "blog-media": { label: "Published blog image", kind: "image" as const, accept: "image/jpeg,image/png,image/webp,image/avif,image/gif" },
  "blog-downloads": { label: "Public blog download", kind: "download" as const, accept: ".pdf,.zip,.txt,.json,application/pdf,application/zip,text/plain,application/json" },
  "portfolio-assets": { label: "Portfolio image or resume", kind: "other" as const, accept: "image/*,.pdf,application/pdf" },
  "draft-media": { label: "Private draft file", kind: "other" as const, accept: "image/*,.pdf,.zip,.txt,.json" },
};

type Destination = keyof typeof destinations;

function safeFileName(value: string): string {
  const extension = value.includes(".") ? `.${value.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const base = value.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "file";
  return `${base}${extension}`;
}

export function MediaUploader({ userId }: { userId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [destination, setDestination] = useState<Destination>("blog-media");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setPending(true);
    setMessage("Uploading securely…");
    const config = destinations[destination];
    const inferredKind = destination === "portfolio-assets"
      ? file.type === "application/pdf" ? "resume" : file.type.startsWith("image/") ? "image" : "other"
      : destination === "draft-media"
        ? file.type.startsWith("image/") ? "image" : "other"
        : config.kind;
    const objectPath = `${userId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from(destination).upload(objectPath, file, { cacheControl: "31536000", contentType: file.type, upsert: false });

    if (uploadError) {
      setMessage(uploadError.message);
      setPending(false);
      return;
    }

    setMessage("Saving metadata…");
    const result = await registerAssetAction({
      kind: inferredKind,
      bucket: destination,
      objectPath,
      originalName: file.name,
      displayName: file.name,
      mimeType: file.type || "application/octet-stream",
      byteSize: file.size,
      altText: null,
    });

    if (!result.ok) {
      await supabase.storage.from(destination).remove([objectPath]);
      setMessage(result.error);
      setPending(false);
      return;
    }

    setMessage("Upload complete.");
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><FileUp className="size-5" /></span>
        <div className="flex-1"><h2 className="font-semibold">Upload a new asset</h2><p className="mt-1 text-sm text-neutral-500">Immutable paths, bucket limits, Storage RLS, and database metadata are applied automatically.</p></div>
        <select value={destination} onChange={(event) => setDestination(event.target.value as Destination)} className="h-10 rounded-full border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950">
          {Object.entries(destinations).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
        </select>
        <label className="admin-primary-button cursor-pointer">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />} {pending ? "Uploading" : "Choose file"}
          <input ref={inputRef} type="file" className="sr-only" accept={destinations[destination].accept} disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
        </label>
      </div>
      {message ? <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300" role="status">{message}</p> : null}
    </section>
  );
}

