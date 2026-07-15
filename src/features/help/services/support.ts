import { supabase } from "@/lib/supabase";
import { generateUuid } from "@/lib/uuid";
import type { Tables } from "@/types/database";

export type SupportTicket = Tables<"support_tickets">;

export const SUPPORT_BUCKET = "support-screenshots";
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
export const SCREENSHOT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type SupportCategory = "question" | "bug" | "feature_request" | "other";

export interface CreateSupportTicketInput {
  category: SupportCategory;
  subject: string;
  description: string;
  /** Storage object path (not a URL); admins resolve a signed URL to view it. */
  screenshotPath?: string | null;
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function validateScreenshotFile(file: File): void {
  if (file.size === 0) {
    throw new Error("The selected image is empty.");
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    throw new Error("Screenshots must be 5 MB or smaller.");
  }
  if (
    !SCREENSHOT_MIME_TYPES.includes(
      file.type as (typeof SCREENSHOT_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Choose a PNG, JPG, JPEG, or WEBP image.");
  }
}

/** Upload an optional screenshot under the user's own prefix; returns its path. */
export async function uploadSupportScreenshot(
  userId: string,
  file: File,
): Promise<string> {
  validateScreenshotFile(file);
  const extension = EXTENSION_BY_TYPE[file.type] ?? "png";
  const path = `${userId}/${generateUuid()}.${extension}`;

  const { error } = await supabase.storage
    .from(SUPPORT_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Screenshot upload failed: ${error.message}`);
  }
  return path;
}

/** Resolve a short-lived signed URL for a stored screenshot path. */
export async function createScreenshotSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(SUPPORT_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) {
    throw new Error(`Screenshot could not be loaded: ${error.message}`);
  }
  return data.signedUrl;
}

export async function createSupportTicket(
  userId: string,
  email: string,
  input: CreateSupportTicketInput,
): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: userId,
      email,
      category: input.category,
      subject: input.subject.trim(),
      description: input.description.trim(),
      screenshot_url: input.screenshotPath ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}
