export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
  content?: TiptapNode[];
};

export type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

export type BlogAsset = {
  id: string;
  kind: "image" | "download" | "resume" | "avatar" | "other";
  storageBucket: string;
  objectPath: string;
  displayName: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  altText: string | null;
  publicUrl: string;
};

export type BlogArticle = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  content: TiptapNode;
  contentText: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  externalUrl: string | null;
  readingTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
  cover: BlogAsset | null;
  tags: BlogTag[];
  attachments: BlogAsset[];
};

export type BlogArticleCard = Omit<BlogArticle, "content" | "contentText" | "attachments">;

export type BlogFeed = {
  articles: BlogArticleCard[];
  nextCursor: string | null;
};

export type BlogTagWithCount = BlogTag & { articleCount: number };

