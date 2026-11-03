import { supabase } from "@/lib/supabase";
import { generateUuid } from "@/lib/uuid";

export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_DIMENSION = 512;
export const AVATAR_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export interface AvatarReplacementResult {
  path: string;
  obsoleteCleanupFailed: boolean;
}

export function validateAvatarFile(file: File): void {
  if (file.size === 0) {
    throw new Error("The selected image is empty.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Avatar images must be 5 MB or smaller.");
  }
  if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) {
    throw new Error("Choose a PNG, JPG, JPEG, or WEBP image.");
  }
}

export async function processAvatarImage(file: File): Promise<Blob> {
  validateAvatarFile(file);

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error("The selected file could not be decoded as an image.");
  }

  try {
    if (image.width < 1 || image.height < 1) {
      throw new Error("The selected image has invalid dimensions.");
    }

    const scale = Math.min(
      1,
      AVATAR_MAX_DIMENSION / Math.max(image.width, image.height),
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Image processing is unavailable in this browser.");
    }

    context.drawImage(image, 0, 0, width, height);
    const processed = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.88);
    });

    if (!processed || processed.size === 0) {
      throw new Error("The image could not be prepared for upload.");
    }
    if (processed.size > MAX_AVATAR_BYTES) {
      throw new Error("The processed avatar is still larger than 5 MB.");
    }
    return processed;
  } finally {
    image.close();
  }
}

export async function uploadAvatarObject(
  userId: string,
  avatar: Blob,
): Promise<string> {
  const path = `${userId}/${generateUuid()}.webp`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, avatar, {
      cacheControl: "3600",
      contentType: "image/webp",
      upsert: false,
    });

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
  return path;
}

export async function createAvatarSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) {
    throw new Error(`Avatar could not be loaded: ${error.message}`);
  }
  return data.signedUrl;
}

export async function removeAvatarObject(path: string): Promise<void> {
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  if (error) throw error;
}

export async function replaceAvatarObject({
  userId,
  previousPath,
  avatar,
  persistReference,
}: {
  userId: string;
  previousPath: string | null;
  avatar: Blob;
  persistReference: (path: string) => Promise<void>;
}): Promise<AvatarReplacementResult> {
  const path = await uploadAvatarObject(userId, avatar);

  try {
    await persistReference(path);
  } catch (error) {
    await removeAvatarObject(path).catch(() => undefined);
    throw error;
  }

  let obsoleteCleanupFailed = false;
  if (previousPath && previousPath !== path) {
    try {
      await removeAvatarObject(previousPath);
    } catch {
      obsoleteCleanupFailed = true;
    }
  }

  return { path, obsoleteCleanupFailed };
}
