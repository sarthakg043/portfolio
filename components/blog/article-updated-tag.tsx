import { formatArticleDate, formatArticleDateTime } from "@/lib/blog/format";

export function ArticleUpdatedTag({ isEdited, updatedAt, compact = false }: { isEdited: boolean; updatedAt: string; compact?: boolean }) {
  if (!isEdited) return null;
  return <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
    Last updated on&nbsp;<time dateTime={updatedAt} title={formatArticleDateTime(updatedAt)}>{compact ? formatArticleDate(updatedAt) : formatArticleDateTime(updatedAt)}</time>
  </span>;
}
