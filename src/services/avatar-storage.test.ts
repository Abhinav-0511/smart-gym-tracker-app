import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAX_AVATAR_BYTES,
  createAvatarSignedUrl,
  processAvatarImage,
  replaceAvatarObject,
  uploadAvatarObject,
  validateAvatarFile,
} from "@/services/avatar-storage";

const storageMocks = vi.hoisted(() => ({
  from: vi.fn(),
  upload: vi.fn(),
  createSignedUrl: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: storageMocks.from,
    },
  },
}));

function imageFile(
  contents: BlobPart[] = ["image"],
  name = "avatar.png",
  type = "image/png",
) {
  return new File(contents, name, { type });
}

describe("avatar storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.from.mockReturnValue({
      upload: storageMocks.upload,
      createSignedUrl: storageMocks.createSignedUrl,
      remove: storageMocks.remove,
    });
    storageMocks.upload.mockResolvedValue({ data: null, error: null });
    storageMocks.remove.mockResolvedValue({ data: [], error: null });
  });

  it("rejects empty, oversized, and unsupported files", () => {
    expect(() => validateAvatarFile(imageFile([]))).toThrow("empty");
    expect(() =>
      validateAvatarFile(
        imageFile([new Uint8Array(MAX_AVATAR_BYTES + 1)]),
      ),
    ).toThrow("5 MB");
    expect(() =>
      validateAvatarFile(imageFile(["gif"], "avatar.gif", "image/gif")),
    ).toThrow("PNG, JPG, JPEG, or WEBP");
  });

  it("rejects files that cannot be decoded as images", async () => {
    const originalCreateImageBitmap = globalThis.createImageBitmap;
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error("decode"));

    await expect(processAvatarImage(imageFile())).rejects.toThrow(
      "could not be decoded",
    );
    globalThis.createImageBitmap = originalCreateImageBitmap;
  });

  it("uploads a processed avatar to a unique owner path", async () => {
    const avatar = new Blob(["webp"], { type: "image/webp" });
    const path = await uploadAvatarObject("user-1", avatar);

    expect(path).toMatch(/^user-1\/[0-9a-f-]{36}\.webp$/);
    expect(storageMocks.from).toHaveBeenCalledWith("avatars");
    expect(storageMocks.upload).toHaveBeenCalledWith(
      path,
      avatar,
      {
        cacheControl: "3600",
        contentType: "image/webp",
        upsert: false,
      },
    );
  });

  it("resolves private avatars through signed URLs", async () => {
    storageMocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.example/avatar" },
      error: null,
    });

    await expect(
      createAvatarSignedUrl("user-1/avatar.webp"),
    ).resolves.toBe("https://signed.example/avatar");
    expect(storageMocks.createSignedUrl).toHaveBeenCalledWith(
      "user-1/avatar.webp",
      3600,
    );
  });

  it("persists the new reference and removes the obsolete object", async () => {
    const persistReference = vi.fn().mockResolvedValue(undefined);
    const result = await replaceAvatarObject({
      userId: "user-1",
      previousPath: "user-1/00000000-0000-4000-8000-000000000001.webp",
      avatar: new Blob(["webp"], { type: "image/webp" }),
      persistReference,
    });

    expect(persistReference).toHaveBeenCalledWith(result.path);
    expect(storageMocks.remove).toHaveBeenCalledWith([
      "user-1/00000000-0000-4000-8000-000000000001.webp",
    ]);
    expect(result.obsoleteCleanupFailed).toBe(false);
  });

  it("rolls back the uploaded object when the profile update fails", async () => {
    const persistReference = vi.fn().mockRejectedValue(new Error("Profile failed"));

    await expect(
      replaceAvatarObject({
        userId: "user-1",
        previousPath: "user-1/00000000-0000-4000-8000-000000000001.webp",
        avatar: new Blob(["webp"], { type: "image/webp" }),
        persistReference,
      }),
    ).rejects.toThrow("Profile failed");

    const uploadedPath = storageMocks.upload.mock.calls[0][0] as string;
    expect(storageMocks.remove).toHaveBeenCalledTimes(1);
    expect(storageMocks.remove).toHaveBeenCalledWith([uploadedPath]);
    expect(storageMocks.remove).not.toHaveBeenCalledWith([
      "user-1/00000000-0000-4000-8000-000000000001.webp",
    ]);
  });
});
