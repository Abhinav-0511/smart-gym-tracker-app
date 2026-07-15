-- Feedback gains a "feedback type" dimension (general / feature request / bug)
-- so product can triage responses by intent, not just rating and module.
--
-- Backward compatibility: the column is added with a NOT NULL default of
-- 'general', which backfills every existing feedback row to General Feedback.
-- RLS is unchanged (the table's existing policies already cover all columns).

alter table public.feedback
  add column if not exists feedback_type text not null default 'general'
  check (feedback_type in ('general', 'feature_request', 'bug'));

-- Aids the admin filter that combines type with the existing date ordering.
create index if not exists feedback_type_idx
  on public.feedback (feedback_type, created_at desc);
