import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addWorkoutSessionSet,
  completeWorkoutSession,
  fetchCompletedWorkoutSessionForPlanDay,
  removeWorkoutSessionSet,
  updateWorkoutNotes,
  updateWorkoutSessionSet,
} from "@/services/workout-sessions";
import type { WorkoutSession } from "@/types/workout-session";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("workout session mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects edits after a session is completed", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: "Workout set is not part of an active session." },
    });

    await expect(
      updateWorkoutSessionSet("session-1", "set-1", { reps: 12 }),
    ).rejects.toThrow("active session");

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "update_workout_session_set",
      expect.objectContaining({
        p_session_id: "session-1",
        p_set_id: "set-1",
      }),
    );
  });

  it("surfaces Supabase RPC error messages as normal errors", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message: "Authentication is required.",
      },
    });

    await expect(
      updateWorkoutSessionSet("session-1", "set-1", { reps: 12 }),
    ).rejects.toThrow("Authentication is required.");
  });

  it("saves session-set changes through the database RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    await expect(
      updateWorkoutSessionSet("session-1", "set-1", {
        reps: 8,
        weightKg: 75,
        isCompleted: true,
      }),
    ).resolves.toBeUndefined();

    expect(supabaseMock.rpc).toHaveBeenCalledWith("update_workout_session_set", {
      p_session_id: "session-1",
      p_set_id: "set-1",
      p_reps: 8,
      p_reps_provided: true,
      p_weight_kg: 75,
      p_weight_provided: true,
      p_is_completed: true,
      p_completed_provided: true,
    });
  });

  it("preserves omitted values during autosave", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    await updateWorkoutSessionSet("session-1", "set-1", { weightKg: 82.5 });

    expect(supabaseMock.rpc).toHaveBeenCalledWith("update_workout_session_set", {
      p_session_id: "session-1",
      p_set_id: "set-1",
      p_reps: null,
      p_reps_provided: false,
      p_weight_kg: 82.5,
      p_weight_provided: true,
      p_is_completed: null,
      p_completed_provided: false,
    });
  });

  it("updates notes through the database RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    await expect(updateWorkoutNotes("session-1", "Felt strong")).resolves.toBeUndefined();

    expect(supabaseMock.rpc).toHaveBeenCalledWith("update_workout_session_notes", {
      p_session_id: "session-1",
      p_notes: "Felt strong",
    });
  });

  it("adds a set through the database RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: "new-set-1", error: null });

    await expect(
      addWorkoutSessionSet("session-1", "session-exercise-1"),
    ).resolves.toBeUndefined();

    expect(supabaseMock.rpc).toHaveBeenCalledWith("add_workout_session_set", {
      p_session_id: "session-1",
      p_session_exercise_id: "session-exercise-1",
    });
  });

  it("removes a set through the database RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    await expect(
      removeWorkoutSessionSet("session-1", "set-1"),
    ).resolves.toBeUndefined();

    expect(supabaseMock.rpc).toHaveBeenCalledWith("remove_workout_session_set", {
      p_session_id: "session-1",
      p_set_id: "set-1",
    });
  });

  it("rejects removing the last remaining set", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "23514",
        message: "An exercise must keep at least one set.",
      },
    });

    await expect(
      removeWorkoutSessionSet("session-1", "set-1"),
    ).rejects.toThrow("at least one set");
  });

  it("loads a completed session for a plan day and date", async () => {
    const session = {
      id: "session-1",
      title: "Triceps Day",
      status: "completed",
      workout_date: "2026-07-06",
      workout_plan_day_id: "day-1",
      notes: "",
      started_at: "2026-07-06T18:00:00.000Z",
      completed_at: "2026-07-06T19:45:00.000Z",
    };
    const sessionChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [session], error: null }),
    };
    const exerciseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "workout_sessions") return sessionChain;
      if (table === "workout_session_exercises") return exerciseChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      fetchCompletedWorkoutSessionForPlanDay(
        "user-1",
        "day-1",
        "2026-07-07",
        "Asia/Calcutta",
      ),
    ).resolves.toMatchObject({
      id: "session-1",
      status: "completed",
      workoutPlanDayId: "day-1",
    });

    expect(sessionChain.eq).toHaveBeenCalledWith("status", "completed");
  });

  it("finalizes a workout and verifies the persisted completed row", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: {
        id: "session-1",
        status: "completed",
        completed_at: "2026-07-07T10:00:00.000Z",
      },
      error: null,
    });

    await expect(completeWorkoutSession("session-1")).resolves.toBeUndefined();
    expect(supabaseMock.rpc).toHaveBeenCalledWith("finalize_workout_session", {
      p_session_id: "session-1",
    });
  });

  it("marks incomplete sets as completed before finalizing a workout", async () => {
    const session: Pick<WorkoutSession, "id" | "exercises"> = {
      id: "session-1",
      exercises: [
        {
          id: "session-exercise-1",
          exerciseId: "exercise-1",
          name: "Bench Press",
          position: 1,
          usesBodyweight: false,
          sets: [
            {
              id: "set-1",
              setNumber: 1,
              reps: 10,
              weightKg: 80,
              isCompleted: false,
              completedAt: null,
            },
            {
              id: "set-2",
              setNumber: 2,
              reps: 8,
              weightKg: 85,
              isCompleted: true,
              completedAt: "2026-07-07T09:55:00.000Z",
            },
          ],
        },
      ],
    };

    supabaseMock.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "session-1",
          status: "completed",
          completed_at: "2026-07-07T10:00:00.000Z",
        },
        error: null,
      });

    await expect(completeWorkoutSession(session)).resolves.toBeUndefined();

    expect(supabaseMock.rpc).toHaveBeenNthCalledWith(
      1,
      "update_workout_session_set",
      expect.objectContaining({
        p_session_id: "session-1",
        p_set_id: "set-1",
        p_is_completed: true,
        p_completed_provided: true,
      }),
    );
    expect(supabaseMock.rpc).toHaveBeenNthCalledWith(
      2,
      "finalize_workout_session",
      { p_session_id: "session-1" },
    );
  });

  it("rejects an unverified completion response", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: null });

    await expect(completeWorkoutSession("session-1")).rejects.toThrow(
      "could not be verified",
    );
  });

  it("falls back to close and verifies completion when finalize RPC is missing", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "session-1",
        status: "completed",
        completed_at: "2026-07-07T10:00:00.000Z",
      },
      error: null,
    });
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    supabaseMock.from.mockReturnValue({ select, eq, maybeSingle });
    supabaseMock.rpc
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST202",
          message:
            "Could not find the function public.finalize_workout_session(p_session_id) in the schema cache",
        },
      })
      .mockResolvedValueOnce({ data: true, error: null });

    await expect(completeWorkoutSession("session-1")).resolves.toBeUndefined();

    expect(supabaseMock.rpc).toHaveBeenNthCalledWith(
      1,
      "finalize_workout_session",
      { p_session_id: "session-1" },
    );
    expect(supabaseMock.rpc).toHaveBeenNthCalledWith(2, "close_workout_session", {
      p_session_id: "session-1",
      p_status: "completed",
    });
    expect(supabaseMock.from).toHaveBeenCalledWith("workout_sessions");
  });
});
