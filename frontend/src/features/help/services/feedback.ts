import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type Feedback = Tables<"feedback">;

export type FeedbackModule = "fitness" | "productivity" | "finance" | "general";

export type FeedbackType = "general" | "feature_request" | "bug";

/** Shared type options — reused by the form and the admin filter so labels never drift. */
export const FEEDBACK_TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "general", label: "General Feedback" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug", label: "Bug Report" },
];

/** Human label for a stored feedback type, tolerant of unknown/legacy values. */
export function feedbackTypeLabel(value: string): string {
  return FEEDBACK_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "General Feedback";
}

export interface SubmitFeedbackInput {
  rating: number;
  feedbackType: FeedbackType;
  module: FeedbackModule;
  comment: string;
}

export async function submitFeedback(
  userId: string,
  email: string,
  input: SubmitFeedbackInput,
): Promise<Feedback> {
  const comment = input.comment.trim();
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      user_id: userId,
      email,
      rating: input.rating,
      feedback_type: input.feedbackType,
      module: input.module,
      comment: comment ? comment : null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}
