// Schema-aligned Supabase types for the unapplied Phase 1 migrations.
// Regenerate this file with `supabase gen types typescript` after the migrations
// are applied to a Supabase project.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      body_weight_entries: {
        Row: {
          created_at: string;
          id: string;
          recorded_on: string;
          updated_at: string;
          user_id: string;
          weight_kg: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          recorded_on?: string;
          updated_at?: string;
          user_id: string;
          weight_kg: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          recorded_on?: string;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number;
        };
        Relationships: [];
      };
      exercise_catalog: {
        Row: {
          category: string | null;
          created_at: string;
          equipment: string | null;
          id: string;
          name: string;
          updated_at: string;
          uses_bodyweight: boolean;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          equipment?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
          uses_bodyweight?: boolean;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          equipment?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
          uses_bodyweight?: boolean;
        };
        Relationships: [];
      };
      personal_records: {
        Row: {
          achieved_on: string;
          created_at: string;
          exercise_id: string;
          id: string;
          source: string;
          updated_at: string;
          user_id: string;
          weight_kg: number;
          workout_session_set_id: string | null;
        };
        Insert: {
          achieved_on?: string;
          created_at?: string;
          exercise_id: string;
          id?: string;
          source: string;
          updated_at?: string;
          user_id: string;
          weight_kg: number;
          workout_session_set_id?: string | null;
        };
        Update: {
          achieved_on?: string;
          created_at?: string;
          exercise_id?: string;
          id?: string;
          source?: string;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number;
          workout_session_set_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercise_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_records_workout_session_set_id_fkey";
            columns: ["workout_session_set_id"];
            isOneToOne: true;
            referencedRelation: "workout_session_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          experience_level: string | null;
          fitness_goal: string | null;
          full_name: string;
          height_cm: number | null;
          id: string;
          theme: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          experience_level?: string | null;
          fitness_goal?: string | null;
          full_name: string;
          height_cm?: number | null;
          id: string;
          theme?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          experience_level?: string | null;
          fitness_goal?: string | null;
          full_name?: string;
          height_cm?: number | null;
          id?: string;
          theme?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_key: string;
          created_at: string;
          id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_key: string;
          created_at?: string;
          id?: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_key?: string;
          created_at?: string;
          id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_plan_days: {
        Row: {
          created_at: string;
          day_of_week: number;
          id: string;
          is_rest_day: boolean;
          updated_at: string;
          workout_plan_id: string;
          workout_type: string;
        };
        Insert: {
          created_at?: string;
          day_of_week: number;
          id?: string;
          is_rest_day?: boolean;
          updated_at?: string;
          workout_plan_id: string;
          workout_type: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          id?: string;
          is_rest_day?: boolean;
          updated_at?: string;
          workout_plan_id?: string;
          workout_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_plan_days_workout_plan_id_fkey";
            columns: ["workout_plan_id"];
            isOneToOne: false;
            referencedRelation: "workout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_plan_exercises: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          position: number;
          updated_at: string;
          workout_plan_day_id: string;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          id?: string;
          position: number;
          updated_at?: string;
          workout_plan_day_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          position?: number;
          updated_at?: string;
          workout_plan_day_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_plan_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercise_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_plan_exercises_workout_plan_day_id_fkey";
            columns: ["workout_plan_day_id"];
            isOneToOne: false;
            referencedRelation: "workout_plan_days";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_plan_sets: {
        Row: {
          created_at: string;
          id: string;
          set_number: number;
          target_reps: number;
          target_weight_kg: number | null;
          updated_at: string;
          workout_plan_exercise_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          set_number: number;
          target_reps: number;
          target_weight_kg?: number | null;
          updated_at?: string;
          workout_plan_exercise_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          set_number?: number;
          target_reps?: number;
          target_weight_kg?: number | null;
          updated_at?: string;
          workout_plan_exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_plan_sets_workout_plan_exercise_id_fkey";
            columns: ["workout_plan_exercise_id"];
            isOneToOne: false;
            referencedRelation: "workout_plan_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_plans: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_session_exercises: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          position: number;
          updated_at: string;
          workout_plan_exercise_id: string | null;
          workout_session_id: string;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          id?: string;
          position: number;
          updated_at?: string;
          workout_plan_exercise_id?: string | null;
          workout_session_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          position?: number;
          updated_at?: string;
          workout_plan_exercise_id?: string | null;
          workout_session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_session_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercise_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_session_exercises_workout_plan_exercise_id_fkey";
            columns: ["workout_plan_exercise_id"];
            isOneToOne: false;
            referencedRelation: "workout_plan_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_session_exercises_workout_session_id_fkey";
            columns: ["workout_session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_session_sets: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          is_completed: boolean;
          reps: number | null;
          set_number: number;
          updated_at: string;
          weight_kg: number | null;
          workout_session_exercise_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          reps?: number | null;
          set_number: number;
          updated_at?: string;
          weight_kg?: number | null;
          workout_session_exercise_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          reps?: number | null;
          set_number?: number;
          updated_at?: string;
          weight_kg?: number | null;
          workout_session_exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_session_sets_workout_session_exercise_id_fkey";
            columns: ["workout_session_exercise_id"];
            isOneToOne: false;
            referencedRelation: "workout_session_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sessions: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          started_at: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          workout_date: string;
          workout_plan_day_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          started_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          workout_date?: string;
          workout_plan_day_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          started_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          workout_date?: string;
          workout_plan_day_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_day_id_fkey";
            columns: ["workout_plan_day_id"];
            isOneToOne: false;
            referencedRelation: "workout_plan_days";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Update"];
