import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  PRIORITY_LABELS,
  REPEAT_LABELS,
} from "@/features/productivity/lib/task-format";
import {
  TASK_PRIORITIES,
  TASK_REPEATS,
  type CreateTaskInput,
  type Task,
  type TaskAttachment,
  type TaskPriority,
  type TaskRepeat,
} from "@/features/productivity/types/task";

/** Convert an ISO instant to a value for <input type="datetime-local">. */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Convert a datetime-local value back to an ISO instant, or null if empty. */
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

interface TaskFormDialogProps {
  open: boolean;
  task: Task | null;
  saving: boolean;
  defaultDueDate?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

const TaskFormDialog = ({
  open,
  task,
  saving,
  defaultDueDate = null,
  onOpenChange,
  onSubmit,
}: TaskFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [repeat, setRepeat] = useState<TaskRepeat>("none");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "medium");
    setDueDate(task?.dueDate ?? defaultDueDate ?? "");
    setDueTime(task?.dueTime?.slice(0, 5) ?? "");
    setDeadline(isoToLocalInput(task?.deadline ?? null));
    setRepeat(task?.repeat ?? "none");
    setLocation(task?.location ?? "");
    setNotes(task?.notes ?? "");
    setReminderEnabled(task?.reminderEnabled ?? false);
    setReminderAt(isoToLocalInput(task?.reminderAt ?? null));
    setAttachments(task?.attachments ?? []);
    setAttachmentName("");
    setAttachmentUrl("");
    setError(null);
  }, [open, task, defaultDueDate]);

  const addAttachment = () => {
    const name = attachmentName.trim();
    const url = attachmentUrl.trim();
    if (!name || !url) return;
    setAttachments((current) => [...current, { name, url }]);
    setAttachmentName("");
    setAttachmentUrl("");
  };

  const removeAttachment = (index: number) => {
    setAttachments((current) => current.filter((_, position) => position !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Give your task a title.");
      return;
    }
    if (dueTime && !dueDate) {
      setError("Add a due date for the chosen time.");
      return;
    }
    if (reminderEnabled && !reminderAt) {
      setError("Choose a reminder time.");
      return;
    }

    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        priority,
        dueDate: dueDate || null,
        dueTime: dueDate && dueTime ? dueTime : null,
        deadline: localInputToIso(deadline),
        repeat,
        reminderEnabled,
        reminderAt: reminderEnabled ? localInputToIso(reminderAt) : null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        attachments,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn’t save task.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>Plan a one-off task with a date, priority and reminder.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              maxLength={200}
              placeholder="e.g. Submit tax documents"
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              maxLength={2000}
              placeholder="Optional details"
              onChange={(event) => setDescription(event.target.value)}
              disabled={saving}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)} disabled={saving}>
                <SelectTrigger aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {PRIORITY_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Repeat</Label>
              <Select value={repeat} onValueChange={(value) => setRepeat(value as TaskRepeat)} disabled={saving}>
                <SelectTrigger aria-label="Repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_REPEATS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {REPEAT_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-time">Due time</Label>
              <Input
                id="task-due-time"
                type="time"
                value={dueTime}
                onChange={(event) => setDueTime(event.target.value)}
                disabled={saving || !dueDate}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-deadline">Hard deadline</Label>
            <Input
              id="task-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-location">Location</Label>
            <Input
              id="task-location"
              value={location}
              maxLength={200}
              placeholder="Optional"
              onChange={(event) => setLocation(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={notes}
              maxLength={5000}
              placeholder="Optional"
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            {attachments.length > 0 && (
              <ul className="space-y-1.5">
                {attachments.map((attachment, index) => (
                  <li
                    key={`${attachment.url}-${index}`}
                    className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${attachment.name}`}
                      onClick={() => removeAttachment(index)}
                      disabled={saving}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={attachmentName}
                placeholder="Label"
                onChange={(event) => setAttachmentName(event.target.value)}
                disabled={saving}
                className="sm:max-w-[10rem]"
                aria-label="Attachment label"
              />
              <Input
                value={attachmentUrl}
                placeholder="https://…"
                onChange={(event) => setAttachmentUrl(event.target.value)}
                disabled={saving}
                aria-label="Attachment URL"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addAttachment}
                disabled={saving || !attachmentName.trim() || !attachmentUrl.trim()}
                className="shrink-0"
              >
                <Plus size={16} /> Add
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
            <div>
              <Label htmlFor="task-reminder" className="cursor-pointer">Reminder</Label>
              <p className="text-xs text-muted-foreground">Get notified before it’s due.</p>
            </div>
            <Switch
              id="task-reminder"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              disabled={saving}
            />
          </div>
          {reminderEnabled && (
            <div className="space-y-2">
              <Label htmlFor="task-reminder-at">Remind me at</Label>
              <Input
                id="task-reminder-at"
                type="datetime-local"
                value={reminderAt}
                onChange={(event) => setReminderAt(event.target.value)}
                disabled={saving}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              {task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;
