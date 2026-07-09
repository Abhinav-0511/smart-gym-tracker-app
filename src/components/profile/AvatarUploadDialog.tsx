import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LoaderCircle, Upload } from "lucide-react";

import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { avatarKeys } from "@/hooks/useAvatarUrl";
import { useToast } from "@/hooks/use-toast";
import {
  createAvatarSignedUrl,
  processAvatarImage,
  replaceAvatarObject,
  validateAvatarFile,
} from "@/services/avatar-storage";

type UploadStage = "idle" | "processing" | "uploading" | "saving";

interface AvatarUploadDialogProps {
  open: boolean;
  userId: string;
  fullName: string;
  currentAvatarPath: string | null;
  onOpenChange: (open: boolean) => void;
  onSaveReference: (path: string) => Promise<void>;
}

const stageProgress: Record<UploadStage, number> = {
  idle: 0,
  processing: 30,
  uploading: 70,
  saving: 90,
};

const AvatarUploadDialog = ({
  open,
  userId,
  fullName,
  currentAvatarPath,
  onOpenChange,
  onSaveReference,
}: AvatarUploadDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedAvatar, setProcessedAvatar] = useState<Blob | null>(null);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const busy = stage !== "idle";

  const replacePreviewUrl = (url: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  useEffect(() => {
    if (open) return;
    replacePreviewUrl(null);
    setProcessedAvatar(null);
    setError(null);
    setStage("idle");
  }, [open]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
    setError(null);
    setProcessedAvatar(null);

    try {
      validateAvatarFile(file);
      replacePreviewUrl(URL.createObjectURL(file));
      setStage("processing");
      const processed = await processAvatarImage(file);
      replacePreviewUrl(URL.createObjectURL(processed));
      setProcessedAvatar(processed);
    } catch (fileError) {
      replacePreviewUrl(null);
      setError(
        fileError instanceof Error
          ? fileError.message
          : "The selected image could not be prepared.",
      );
    } finally {
      setStage("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!processedAvatar || busy) return;
    setError(null);

    try {
      setStage("uploading");
      const result = await replaceAvatarObject({
        userId,
        previousPath: currentAvatarPath,
        avatar: processedAvatar,
        persistReference: async (path) => {
          setStage("saving");
          await onSaveReference(path);
        },
      });

      try {
        const signedUrl = await createAvatarSignedUrl(result.path);
        queryClient.setQueryData(avatarKeys.detail(result.path), signedUrl);
      } catch {
        await queryClient.invalidateQueries({
          queryKey: avatarKeys.detail(result.path),
        });
      }
      if (currentAvatarPath) {
        queryClient.removeQueries({
          queryKey: avatarKeys.detail(currentAvatarPath),
          exact: true,
        });
      }

      toast({
        title: "Avatar updated",
        description: result.obsoleteCleanupFailed
          ? "Your avatar was saved. An older file will need cleanup later."
          : "Your new profile photo is ready.",
      });
      onOpenChange(false);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The avatar could not be uploaded. Your previous avatar is unchanged.",
      );
      setStage("idle");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Avatar</DialogTitle>
          <DialogDescription>
            Choose a PNG, JPG, JPEG, or WEBP image up to 5 MB.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected avatar preview"
              className="h-36 w-36 rounded-full bg-secondary object-cover"
            />
          ) : (
            <ProfileAvatar
              avatarPath={currentAvatarPath}
              fullName={fullName}
              className="h-36 w-36"
              fallbackClassName="text-3xl"
            />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,.jpg,.jpeg"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={16} />
            {processedAvatar ? "Choose Another Image" : "Choose Image"}
          </Button>
        </div>

        {busy && (
          <div role="status" aria-live="polite" className="space-y-2">
            <div
              className="h-2 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label="Avatar upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stageProgress[stage]}
            >
              <div
                className="h-full bg-primary transition-[width]"
                style={{ width: `${stageProgress[stage]}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {stage === "processing"
                ? "Preparing image…"
                : stage === "uploading"
                  ? "Uploading avatar…"
                  : "Saving profile…"}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!processedAvatar || busy}
            onClick={() => void handleUpload()}
          >
            {busy ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Upload Avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarUploadDialog;
