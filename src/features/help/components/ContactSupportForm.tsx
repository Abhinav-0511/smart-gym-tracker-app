import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  createSupportTicket,
  uploadSupportScreenshot,
  validateScreenshotFile,
  type SupportCategory,
} from "@/features/help/services/support";

const CATEGORY_OPTIONS: { value: SupportCategory; label: string }[] = [
  { value: "question", label: "Question" },
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];

/**
 * In-app support form. Persists a ticket (and optional screenshot) to Supabase.
 * Uses controlled inputs + toasts to match the app's existing form style.
 */
const ContactSupportForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<SupportCategory>("question");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }
    try {
      validateScreenshotFile(selected);
      setFile(selected);
    } catch (validationError) {
      toast({
        variant: "destructive",
        title: "Couldn’t attach image",
        description:
          validationError instanceof Error ? validationError.message : "Invalid file.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!user?.id || !user.email) {
      toast({
        variant: "destructive",
        title: "You’re not signed in",
        description: "Please sign in again to contact support.",
      });
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing details",
        description: "Please add a subject and a description.",
      });
      return;
    }

    setSubmitting(true);
    try {
      let screenshotPath: string | null = null;
      if (file) {
        screenshotPath = await uploadSupportScreenshot(user.id, file);
      }
      await createSupportTicket(user.id, user.email, {
        category,
        subject,
        description,
        screenshotPath,
      });
      setSubmitted(true);
    } catch (submitError) {
      toast({
        variant: "destructive",
        title: "Couldn’t send your message",
        description:
          submitError instanceof Error ? submitError.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-6 text-center" role="status">
        <CheckCircle2 size={32} className="mx-auto mb-3 text-primary" />
        <h3 className="font-semibold text-foreground">Message sent</h3>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          Thanks — our team has your ticket and will follow up by email.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => {
            setSubmitted(false);
            setSubject("");
            setDescription("");
            setCategory("question");
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="support-category">Category</Label>
        <Select value={category} onValueChange={(value) => setCategory(value as SupportCategory)}>
          <SelectTrigger id="support-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-subject">Subject</Label>
        <Input
          id="support-subject"
          value={subject}
          maxLength={160}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Briefly, what’s this about?"
          disabled={submitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-description">Description</Label>
        <Textarea
          id="support-description"
          value={description}
          maxLength={5000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell us what happened, or what you need help with."
          rows={5}
          disabled={submitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-screenshot">Screenshot (optional)</Label>
        {file ? (
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm">
            <span className="truncate text-foreground">{file.name}</span>
            <button
              type="button"
              aria-label="Remove attachment"
              className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={submitting}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={16} />
            Attach an image
          </Button>
        )}
        <input
          ref={fileInputRef}
          id="support-screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting && <LoaderCircle size={16} className="animate-spin" />}
        {submitting ? "Sending…" : "Submit"}
      </Button>
    </form>
  );
};

export default ContactSupportForm;
