export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          score: number | null
          type: string
          user_id: string
          weight: number
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          score?: number | null
          type: string
          user_id: string
          weight: number
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          score?: number | null
          type?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_integrity: Json | null
          ai_policy: Json | null
          code: string
          color: string | null
          communication: Json | null
          created_at: string | null
          credits: number | null
          crn: string | null
          delivery_mode: string | null
          description: string | null
          final_exam: Json | null
          grading_categories: Json | null
          grading_scale: Json | null
          id: string
          important_dates: Json | null
          institution: string | null
          instructor: Json | null
          learning_objectives: string[] | null
          materials: string[] | null
          materials_data: Json | null
          modules: Json | null
          name: string
          policies: Json | null
          prerequisites: Json | null
          schedule: Json | null
          section: string | null
          semester_id: string | null
          support_resources: Json | null
          teaching_assistant: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academic_integrity?: Json | null
          ai_policy?: Json | null
          code: string
          color?: string | null
          communication?: Json | null
          created_at?: string | null
          credits?: number | null
          crn?: string | null
          delivery_mode?: string | null
          description?: string | null
          final_exam?: Json | null
          grading_categories?: Json | null
          grading_scale?: Json | null
          id?: string
          important_dates?: Json | null
          institution?: string | null
          instructor?: Json | null
          learning_objectives?: string[] | null
          materials?: string[] | null
          materials_data?: Json | null
          modules?: Json | null
          name: string
          policies?: Json | null
          prerequisites?: Json | null
          schedule?: Json | null
          section?: string | null
          semester_id?: string | null
          support_resources?: Json | null
          teaching_assistant?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academic_integrity?: Json | null
          ai_policy?: Json | null
          code?: string
          color?: string | null
          communication?: Json | null
          created_at?: string | null
          credits?: number | null
          crn?: string | null
          delivery_mode?: string | null
          description?: string | null
          final_exam?: Json | null
          grading_categories?: Json | null
          grading_scale?: Json | null
          id?: string
          important_dates?: Json | null
          institution?: string | null
          instructor?: Json | null
          learning_objectives?: string[] | null
          materials?: string[] | null
          materials_data?: Json | null
          modules?: Json | null
          name?: string
          policies?: Json | null
          prerequisites?: Json | null
          schedule?: Json | null
          section?: string | null
          semester_id?: string | null
          support_resources?: Json | null
          teaching_assistant?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          gpa_goal: number | null
          graduation_year: number | null
          has_accepted_disclaimer: boolean | null
          has_completed_onboarding: boolean | null
          id: string
          major: string | null
          notification_preferences: Json | null
          primary_challenge: string | null
          signup_source: string | null
          university: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          gpa_goal?: number | null
          graduation_year?: number | null
          has_accepted_disclaimer?: boolean | null
          has_completed_onboarding?: boolean | null
          id: string
          major?: string | null
          notification_preferences?: Json | null
          primary_challenge?: string | null
          signup_source?: string | null
          university?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          gpa_goal?: number | null
          graduation_year?: number | null
          has_accepted_disclaimer?: boolean | null
          has_completed_onboarding?: boolean | null
          id?: string
          major?: string | null
          notification_preferences?: Json | null
          primary_challenge?: string | null
          signup_source?: string | null
          university?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      semesters: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "semesters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          id: string
          user_id: string
          habits: Json
          completion_history: Json
          focus_sessions: Json
          total_focus_minutes: number
          achievements: Json
          study_streak: number
          last_study_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habits?: Json
          completion_history?: Json
          focus_sessions?: Json
          total_focus_minutes?: number
          achievements?: Json
          study_streak?: number
          last_study_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habits?: Json
          completion_history?: Json
          focus_sessions?: Json
          total_focus_minutes?: number
          achievements?: Json
          study_streak?: number
          last_study_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
