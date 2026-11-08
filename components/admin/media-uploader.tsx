"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { registerAssetAction } from "@/app/site-admin/media/actions";
import { createClient } from "@/lib/supabase/client";

type Destination = "blog-media" | "blog-downloads" | "portfolio-assets" | "draft-media";

type DestinationConfig = {
  label: string;
  kind: "image" | "download" | "other";
  accept: string;
  allowedMimeTypes: readonly string[];
};

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

const destinations: Record<Destination, DestinationConfig> = {
  "blog-media": { label: "Published blog image", kind: "image", accept: imageMimeTypes.join(","), allowedMimeTypes: imageMimeTypes },
  "blog-downloads": { label: "Public blog download", kind: "download", accept: "application/pdf,application/zip,text/plain,application/json", allowedMimeTypes: ["application/pdf", "application/zip", "text/plain", "application/json"] },
  "portfolio-assets": { label: "Portfolio image or resume", kind: "other", accept: [...imageMimeTypes, "application/pdf"].join(","), allowedMimeTypes: [...imageMimeTypes, "application/pdf"] },
  "draft-media": { label: "Private draft file", kind: "other", accept: [...imageMimeTypes, "application/pdf", "application/zip"].join(","), allowedMimeTypes: [...imageMimeTypes, "application/pdf", "application/zip"] },
};

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
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  async function upload(file: File) {
    if (busy.current) return;
    setFailed(false);
    const config = destinations[destination];
    if (!config.allowedMimeTypes.includes(file.type)) {
      setFailed(true);
      setMessage(`This file type is not allowed in ${config.label.toLowerCase()}.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const limit = destination === "blog-media" ? 10 : 50;
    if (!file.size || file.size > limit * 1024 * 1024) {
      setFailed(true);
      setMessage(`Choose a non-empty file smaller than ${limit} MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    busy.current = true;
    setPending(true);
    setMessage("Uploading securely…");
    try {
    const inferredKind = destination === "portfolio-assets"
      ? file.type === "application/pdf" ? "resume" : file.type.startsWith("image/") ? "image" : "other"
      : destination === "draft-media"
        ? file.type.startsWith("image/") ? "image" : "other"
        : config.kind;
    const objectPath = `${userId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from(destination).upload(objectPath, file, { cacheControl: "31536000", contentType: file.type, upsert: false });

    if (uploadError) {
      setFailed(true);
      setMessage("Upload failed. Check your connection and sign-in session, then choose the file again to retry.");
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
      const { error: cleanupError } = await supabase.storage.from(destination).remove([objectPath]);
      setFailed(true);
      setMessage(`${result.error}${cleanupError ? " File cleanup also failed; check Storage before uploading again." : " Please choose the file again to retry."}`);
      return;
    }

    setMessage("Upload complete.");
    router.refresh();
    } catch {
      setFailed(true);
      setMessage("The upload could not be completed. Check the media library before retrying, as the file may have reached Storage.");
    } finally {
      busy.current = false;
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section aria-busy={pending} className="rounded-3xl border border-dashed border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><FileUp className="size-5" /></span>
        <div className="flex-1"><h2 className="font-semibold">Upload a new asset</h2><p className="mt-1 text-sm text-neutral-500">Immutable paths, bucket limits, Storage RLS, and database metadata are applied automatically.</p></div>
        <select aria-label="Upload destination" disabled={pending} value={destination} onChange={(event) => setDestination(event.target.value as Destination)} className="h-10 rounded-full border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950">
          {Object.entries(destinations).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
        </select>
        <label className="admin-primary-button cursor-pointer">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />} {pending ? "Uploading" : "Choose file"}
          <input ref={inputRef} type="file" className="sr-only" accept={destinations[destination].accept} disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
        </label>
      </div>
      {pending ? <div role="progressbar" aria-label="Uploading file" className="mt-4 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"><div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-600" /></div> : null}
      {message ? <p className={`mt-3 text-sm ${failed ? "text-red-700 dark:text-red-400" : "text-neutral-600 dark:text-neutral-300"}`} role={failed ? "alert" : "status"}>{message}</p> : null}
    </section>
  );
}
