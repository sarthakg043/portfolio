import { z } from "zod";

export const httpsUrlSchema = z.string().trim().pipe(
  z.url().startsWith("https://")
);

export const optionalHttpsUrlSchema = z.string().trim().pipe(
  z.union([z.literal(""), z.url().startsWith("https://")])
).transform((value) => value || null);
