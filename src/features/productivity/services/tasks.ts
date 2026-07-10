import { supabase } from "@/lib/supabase";
import type { Json, Tables, TablesUpdate } from "@/types/database";
import type {
  CreateTaskInput,
  Task,
  TaskAttachment,
  TaskPriority,
  TaskRepeat,
  TaskStatus,
  UpdateTaskInput,
} from "@/features/productivity/types/task";

type SupabaseLikeError = { code?: string; message: string };

function throwIfError(error: SupabaseLikeError | null): void {
  if (error) throw new Error(error.message);
}

function parseAttachments(value: Json): TaskAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): TaskAttachment[] => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const name = (item as Record<string, unknown>).name;
      const url = (item as Record<string, unknown>).url;
      if (typeof name === "string" && typeof url === "string") {
        return [{ name, url }];
      }
    }
    return [];
  });
}

function mapTask(row: Tables<"tasks">): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    priority: row.priority as TaskPriority,
    dueDate: row.due_date,
    dueTime: row.due_time,
    deadline: row.deadline,
    repeat: row.repeat as TaskRepeat,
    reminderEnabled: row.reminder_enabled,
    reminderAt: row.reminder_at,
    location: row.location,
    notes: row.notes,
    attachments: parseAttachments(row.attachments),
    status: row.status as TaskStatus,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Build the insert/update payload shared by create and update. */
function toWritePayload(input: Partial<CreateTaskInput>): TablesUpdate<"tasks"> {
  const payload: TablesUpdate<"tasks"> = {};

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
  if (input.dueTime !== undefined) payload.due_time = input.dueTime || null;
  if (input.deadline !== undefined) payload.deadline = input.deadline || null;
  if (input.repeat !== undefined) payload.repeat = input.repeat;
  if (input.reminderEnabled !== undefined) {
    payload.reminder_enabled = input.reminderEnabled;
    if (!input.reminderEnabled) payload.reminder_at = null;
  }
  if (input.reminderAt !== undefined) payload.reminder_at = input.reminderAt || null;
  if (input.location !== undefined) payload.location = input.location?.trim() || null;
  if (input.notes !== undefined) payload.notes = input.notes?.trim() || null;
  if (input.attachments !== undefined) payload.attachments = input.attachments as unknown as Json;

  return payload;
}

export interface FetchTasksOptions {
  includeArchived?: boolean;
}

export async function fetchTasks(
  userId: string,
  options: FetchTasksOptions = {},
): Promise<Task[]> {
  const query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!options.includeArchived) {
    query.neq("status", "archived");
  }

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []).map(mapTask);
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: userId, ...toWritePayload(input), title: input.title.trim() })
    .select("*")
    .single();

  throwIfError(error);
  return mapTask(data as Tables<"tasks">);
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const payload = toWritePayload(input);

  if (input.status !== undefined) {
    payload.status = input.status;
    payload.completed_at = input.status === "completed" ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .select("*")
    .single();

  throwIfError(error);
  return mapTask(data as Tables<"tasks">);
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  return updateTask(taskId, { status });
}

export async function rescheduleTask(
  taskId: string,
  dueDate: string | null,
  dueTime: string | null = null,
): Promise<Task> {
  return updateTask(taskId, { dueDate, dueTime });
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  throwIfError(error);
}

export async function duplicateTask(userId: string, task: Task): Promise<Task> {
  return createTask(userId, {
    title: `${task.title} (copy)`.slice(0, 200),
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    deadline: task.deadline,
    repeat: task.repeat,
    reminderEnabled: task.reminderEnabled,
    reminderAt: task.reminderAt,
    location: task.location,
    notes: task.notes,
    attachments: task.attachments,
  });
}
