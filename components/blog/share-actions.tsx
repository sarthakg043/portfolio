"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/brands";

export function ShareActions({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await copy();
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2" aria-label="Share article">
      <button type="button" onClick={share} className="blog-icon-button" aria-label="Share article">
        <Share2 className="size-4" />
      </button>
      <button type="button" onClick={copy} className="blog-icon-button" aria-label="Copy article link">
        {copied ? <Check className="size-4 text-emerald-600" /> : <Link2 className="size-4" />}
      </button>
      <a href={linkedIn} target="_blank" rel="noreferrer noopener" className="blog-icon-button" aria-label="Share on LinkedIn">
        <LinkedinIcon className="size-4" />
      </a>
    </div>
  );
}
