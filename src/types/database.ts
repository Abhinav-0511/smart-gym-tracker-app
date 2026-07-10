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
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string;
          dedupe_key: string | null;
          icon: string;
          id: string;
          message: string;
          metadata: Json;
          priority: string;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          icon: string;
          id?: string;
          message: string;
          metadata?: Json;
          priority?: string;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          icon?: string;
          id?: string;
          message?: string;
          metadata?: Json;
          priority?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
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
      habits: {
        Row: {
          category: string;
          color: string;
          created_at: string;
          custom_days: number[] | null;
          description: string | null;
          frequency: string;
          icon: string;
          id: string;
          reminder_enabled: boolean;
          reminder_time: string | null;
          status: string;
          target_value: number | null;
          title: string;
          unit: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: string;
          color?: string;
          created_at?: string;
          custom_days?: number[] | null;
          description?: string | null;
          frequency?: string;
          icon?: string;
          id?: string;
          reminder_enabled?: boolean;
          reminder_time?: string | null;
          status?: string;
          target_value?: number | null;
          title: string;
          unit?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          color?: string;
          created_at?: string;
          custom_days?: number[] | null;
          description?: string | null;
          frequency?: string;
          icon?: string;
          id?: string;
          reminder_enabled?: boolean;
          reminder_time?: string | null;
          status?: string;
          target_value?: number | null;
          title?: string;
          unit?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      habit_logs: {
        Row: {
          completed: boolean;
          created_at: string;
          habit_id: string;
          id: string;
          log_date: string;
          updated_at: string;
          user_id: string;
          value: number | null;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          habit_id: string;
          id?: string;
          log_date?: string;
          updated_at?: string;
          user_id: string;
          value?: number | null;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          habit_id?: string;
          id?: string;
          log_date?: string;
          updated_at?: string;
          user_id?: string;
          value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          attachments: Json;
          completed_at: string | null;
          created_at: string;
          deadline: string | null;
          description: string | null;
          due_date: string | null;
          due_time: string | null;
          id: string;
          location: string | null;
          notes: string | null;
          priority: string;
          reminder_at: string | null;
          reminder_enabled: boolean;
          repeat: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attachments?: Json;
          completed_at?: string | null;
          created_at?: string;
          deadline?: string | null;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          id?: string;
          location?: string | null;
          notes?: string | null;
          priority?: string;
          reminder_at?: string | null;
          reminder_enabled?: boolean;
          repeat?: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attachments?: Json;
          completed_at?: string | null;
          created_at?: string;
          deadline?: string | null;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          id?: string;
          location?: string | null;
          notes?: string | null;
          priority?: string;
          reminder_at?: string | null;
          reminder_enabled?: boolean;
          repeat?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      productivity_notifications: {
        Row: {
          action_url: string | null;
          created_at: string;
          dedupe_key: string | null;
          icon: string;
          id: string;
          message: string;
          metadata: Json;
          priority: string;
          read_at: string | null;
          scheduled_for: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          icon: string;
          id?: string;
          message: string;
          metadata?: Json;
          priority?: string;
          read_at?: string | null;
          scheduled_for?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          icon?: string;
          id?: string;
          message?: string;
          metadata?: Json;
          priority?: string;
          read_at?: string | null;
          scheduled_for?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      finance_accounts: {
        Row: {
          color: string;
          created_at: string;
          currency: string;
          icon: string;
          id: string;
          initial_balance: number;
          is_archived: boolean;
          name: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          currency?: string;
          icon?: string;
          id?: string;
          initial_balance?: number;
          is_archived?: boolean;
          name: string;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          currency?: string;
          icon?: string;
          id?: string;
          initial_balance?: number;
          is_archived?: boolean;
          name?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transaction_categories: {
        Row: {
          color: string;
          created_at: string;
          icon: string;
          id: string;
          is_default: boolean;
          kind: string;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_default?: boolean;
          kind: string;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_default?: boolean;
          kind?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      recurring_transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          category_id: string | null;
          created_at: string;
          end_on: string | null;
          frequency: string;
          id: string;
          is_active: boolean;
          next_run_on: string;
          notes: string | null;
          payment_method: string;
          start_on: string;
          title: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          end_on?: string | null;
          frequency: string;
          id?: string;
          is_active?: boolean;
          next_run_on?: string;
          notes?: string | null;
          payment_method?: string;
          start_on?: string;
          title: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          end_on?: string | null;
          frequency?: string;
          id?: string;
          is_active?: boolean;
          next_run_on?: string;
          notes?: string | null;
          payment_method?: string;
          start_on?: string;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "finance_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "transaction_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          category_id: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          occurred_at: string | null;
          occurred_on: string;
          payment_method: string;
          receipt_url: string | null;
          recurring_transaction_id: string | null;
          tags: string[];
          title: string;
          transfer_account_id: string | null;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          occurred_at?: string | null;
          occurred_on?: string;
          payment_method?: string;
          receipt_url?: string | null;
          recurring_transaction_id?: string | null;
          tags?: string[];
          title: string;
          transfer_account_id?: string | null;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          occurred_at?: string | null;
          occurred_on?: string;
          payment_method?: string;
          receipt_url?: string | null;
          recurring_transaction_id?: string | null;
          tags?: string[];
          title?: string;
          transfer_account_id?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "finance_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "transaction_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_recurring_transaction_id_fkey";
            columns: ["recurring_transaction_id"];
            isOneToOne: false;
            referencedRelation: "recurring_transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          amount: number;
          category_id: string | null;
          color: string;
          created_at: string;
          id: string;
          name: string;
          period: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          period?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          period?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "transaction_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      savings_goals: {
        Row: {
          color: string;
          created_at: string;
          current_amount: number;
          icon: string;
          id: string;
          name: string;
          status: string;
          target_amount: number;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          current_amount?: number;
          icon?: string;
          id?: string;
          name: string;
          status?: string;
          target_amount: number;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          current_amount?: number;
          icon?: string;
          id?: string;
          name?: string;
          status?: string;
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      habit_completion_totals: {
        Row: {
          completed_count: number | null;
          first_completed_on: string | null;
          habit_id: string | null;
          last_completed_on: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      activate_workout_plan: {
        Args: {
          p_plan_id: string;
        };
        Returns: boolean;
      };
      add_plan_exercise_with_sets: {
        Args: {
          p_allow_duplicate?: boolean;
          p_day_id: string;
          p_exercise_id: string;
        };
        Returns: string;
      };
      add_plan_set: {
        Args: {
          p_plan_exercise_id: string;
        };
        Returns: string;
      };
      add_workout_session_exercise: {
        Args: {
          p_exercise_id: string;
          p_session_id: string;
        };
        Returns: string;
      };
      add_workout_session_set: {
        Args: {
          p_session_exercise_id: string;
          p_session_id: string;
        };
        Returns: string;
      };
      close_workout_session: {
        Args: {
          p_session_id: string;
          p_status: string;
        };
        Returns: boolean;
      };
      create_exercise_catalog_item: {
        Args: {
          p_name: string;
        };
        Returns: Database["public"]["Tables"]["exercise_catalog"]["Row"];
      };
      create_workout_plan: {
        Args: {
          p_name: string;
        };
        Returns: string;
      };
      delete_workout_plan: {
        Args: {
          p_plan_id: string;
        };
        Returns: boolean;
      };
      finalize_workout_session: {
        Args: {
          p_session_id: string;
        };
        Returns: Database["public"]["Tables"]["workout_sessions"]["Row"];
      };
      reconcile_achievements: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["user_achievements"]["Row"][];
      };
      reconcile_personal_records: {
        Args: Record<string, never>;
        Returns: number;
      };
      remove_plan_set: {
        Args: {
          p_set_id: string;
        };
        Returns: boolean;
      };
      remove_workout_session_set: {
        Args: {
          p_session_id: string;
          p_set_id: string;
        };
        Returns: boolean;
      };
      reorder_plan_exercises: {
        Args: {
          p_day_id: string;
          p_ordered_ids: string[];
        };
        Returns: boolean;
      };
      start_workout_session: {
        Args: {
          p_plan_day_id: string;
          p_workout_date?: string;
        };
        Returns: string;
      };
      update_workout_session_set: {
        Args: {
          p_completed_provided: boolean;
          p_is_completed: boolean | null;
          p_reps: number | null;
          p_reps_provided: boolean;
          p_session_id: string;
          p_set_id: string;
          p_weight_provided: boolean;
          p_weight_kg: number | null;
        };
        Returns: boolean;
      };
      update_workout_session_notes: {
        Args: {
          p_notes: string;
          p_session_id: string;
        };
        Returns: boolean;
      };
    };
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
