import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  FEEDBACK_TYPE_OPTIONS,
  submitFeedback,
  type FeedbackModule,
  type FeedbackType,
} from "@/features/help/services/feedback";

const MODULE_OPTIONS: { value: FeedbackModule; label: string }[] = [
  { value: "fitness", label: "Fitness" },
  { value: "productivity", label: "Productivity" },
  { value: "finance", label: "Finance" },
  { value: "general", label: "General" },
];

interface FeedbackFormProps {
  defaultModule?: FeedbackModule;
}

/** Rating + type + module + comment feedback. Persists to Supabase. */
const FeedbackForm = ({ defaultModule = "general" }: FeedbackFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [module, setModule] = useState<FeedbackModule>(defaultModule);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!user?.id || !user.email) {
      toast({
        variant: "destructive",
        title: "You’re not signed in",
        description: "Please sign in again to send feedback.",
      });
      return;
    }
    if (rating < 1) {
      toast({
        variant: "destructive",
        title: "Add a rating",
        description: "Please choose a star rating first.",
      });
      return;
    }
    if (!feedbackType || !module) {
      toast({
        variant: "destructive",
        title: "Missing details",
        description: "Please choose a feedback type and an area.",
      });
      return;
    }
    if (!comment.trim()) {
      toast({
        variant: "destructive",
        title: "Add a comment",
        description: "Please tell us a little more before submitting.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback(user.id, user.email, {
        rating,
        feedbackType,
        module,
        comment,
      });
      setSubmitted(true);
    } catch (submitError) {
      toast({
        variant: "destructive",
        title: "Couldn’t send feedback",
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
        <h3 className="font-semibold text-foreground">Thanks for the feedback</h3>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          We read every response — it helps shape what we build next.
        </p>
      </div>
    );
  }

  const activeStars = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>How would you rate your experience?</Label>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Star rating"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              className="rounded-md p-1 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onFocus={() => setHovered(value)}
              onBlur={() => setHovered(0)}
              onClick={() => setRating(value)}
            >
              <Star
                size={28}
                className={cn(
                  "transition-colors",
                  value <= activeStars
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/50",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedback-type">Feedback type</Label>
        <Select value={feedbackType} onValueChange={(value) => setFeedbackType(value as FeedbackType)}>
          <SelectTrigger id="feedback-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEEDBACK_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedback-module">Which area is this about?</Label>
        <Select value={module} onValueChange={(value) => setModule(value as FeedbackModule)}>
          <SelectTrigger id="feedback-module">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedback-comment">Comment</Label>
        <Textarea
          id="feedback-comment"
          value={comment}
          maxLength={2000}
          required
          onChange={(event) => setComment(event.target.value)}
          placeholder="What’s working well, or what could be better?"
          rows={4}
          disabled={submitting}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting && <LoaderCircle size={16} className="animate-spin" />}
        {submitting ? "Sending…" : "Send Feedback"}
      </Button>
    </form>
  );
};

export default FeedbackForm;
