import "server-only";

import { z } from "zod";

const adminEmailSchema = z
  .email()
  .transform((email) => email.trim().toLowerCase());

export function hasAdminEmailConfig(): boolean {
  return adminEmailSchema.safeParse(process.env.ADMIN_EMAIL).success;
}

export function getAdminEmail(): string {
  const result = adminEmailSchema.safeParse(process.env.ADMIN_EMAIL);

  if (!result.success) {
    throw new Error(
      "ADMIN_EMAIL is missing or invalid. Add the sole administrator's GitHub email to the server environment."
    );
  }

  return result.data;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const candidate = adminEmailSchema.safeParse(email);
  const configured = adminEmailSchema.safeParse(process.env.ADMIN_EMAIL);

  return (
    candidate.success &&
    configured.success &&
    candidate.data === configured.data
  );
}
