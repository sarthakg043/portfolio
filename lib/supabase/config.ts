import { z } from "zod";

const publicSupabaseSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function getSupabaseConfig(): SupabasePublicConfig {
  const result = publicSupabaseSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add the project URL and publishable key."
    );
  }

  return result.data;
}
