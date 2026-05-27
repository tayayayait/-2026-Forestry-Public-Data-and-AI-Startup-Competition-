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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      facilities: {
        Row: {
          accessibility: Json | null
          address: string
          created_at: string | null
          external_id: string | null
          homepage: string | null
          id: string
          intro: string | null
          lat: number
          lng: number
          metadata: Json | null
          name: string
          operator: string | null
          participation_method: string | null
          programs: string[] | null
          region: string | null
          tel: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          accessibility?: Json | null
          address: string
          created_at?: string | null
          external_id?: string | null
          homepage?: string | null
          id?: string
          intro?: string | null
          lat: number
          lng: number
          metadata?: Json | null
          name: string
          operator?: string | null
          participation_method?: string | null
          programs?: string[] | null
          region?: string | null
          tel?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          accessibility?: Json | null
          address?: string
          created_at?: string | null
          external_id?: string | null
          homepage?: string | null
          id?: string
          intro?: string | null
          lat?: number
          lng?: number
          metadata?: Json | null
          name?: string
          operator?: string | null
          participation_method?: string | null
          programs?: string[] | null
          region?: string | null
          tel?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      facility_image_curations: {
        Row: {
          created_at: string
          facility_id: string
          facility_name: string
          images: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          facility_name: string
          images?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          facility_name?: string
          images?: Json
          updated_at?: string
        }
        Relationships: []
      }
      forest_plants: {
        Row: {
          id: number
          category: string | null
          name: string
          english_name: string | null
          guide: string | null
          scientific_name: string | null
          class_name: string | null
          habitat: string | null
          lifetime: string | null
          story: string | null
          offer: string | null
          registered_at: string | null
          created_at: string
        }
        Insert: {
          id: number
          category?: string | null
          name: string
          english_name?: string | null
          guide?: string | null
          scientific_name?: string | null
          class_name?: string | null
          habitat?: string | null
          lifetime?: string | null
          story?: string | null
          offer?: string | null
          registered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          category?: string | null
          name?: string
          english_name?: string | null
          guide?: string | null
          scientific_name?: string | null
          class_name?: string | null
          habitat?: string | null
          lifetime?: string | null
          story?: string | null
          offer?: string | null
          registered_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      health_profiles: {
        Row: {
          accessibility_needs: string[]
          companions: string
          created_at: string
          fitness_level: string
          id: string
          max_travel_time: number
          preferred_activities: string[]
          sleep_quality: string
          stress_level: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility_needs?: string[]
          companions: string
          created_at?: string
          fitness_level: string
          id?: string
          max_travel_time: number
          preferred_activities?: string[]
          sleep_quality: string
          stress_level: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility_needs?: string[]
          companions?: string
          created_at?: string
          fitness_level?: string
          id?: string
          max_travel_time?: number
          preferred_activities?: string[]
          sleep_quality?: string
          stress_level?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          environment_data: Json
          expected_effects: Json | null
          facility_data: Json
          id: string
          match_score: number | null
          nearby_places: Json | null
          program_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          environment_data: Json
          expected_effects?: Json | null
          facility_data: Json
          id?: string
          match_score?: number | null
          nearby_places?: Json | null
          program_data: Json
          user_id: string
        }
        Update: {
          created_at?: string
          environment_data?: Json
          expected_effects?: Json | null
          facility_data?: Json
          id?: string
          match_score?: number | null
          nearby_places?: Json | null
          program_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      saved_courses: {
        Row: {
          created_at: string | null
          facility_name: string
          id: string
          is_bookmarked: boolean | null
          memo: string | null
          recommendation_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          facility_name: string
          id?: string
          is_bookmarked?: boolean | null
          memo?: string | null
          recommendation_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          facility_name?: string
          id?: string
          is_bookmarked?: boolean | null
          memo?: string | null
          recommendation_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_courses_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_records: {
        Row: {
          activities: string[] | null
          created_at: string
          duration_minutes: number | null
          facility_name: string
          id: string
          memo: string | null
          mood_change: string | null
          photos: string[] | null
          post_sleep: string | null
          post_stress: number | null
          pre_sleep: string | null
          pre_stress: number | null
          recommendation_id: string | null
          user_id: string
          visit_date: string
        }
        Insert: {
          activities?: string[] | null
          created_at?: string
          duration_minutes?: number | null
          facility_name: string
          id?: string
          memo?: string | null
          mood_change?: string | null
          photos?: string[] | null
          post_sleep?: string | null
          post_stress?: number | null
          pre_sleep?: string | null
          pre_stress?: number | null
          recommendation_id?: string | null
          user_id: string
          visit_date: string
        }
        Update: {
          activities?: string[] | null
          created_at?: string
          duration_minutes?: number | null
          facility_name?: string
          id?: string
          memo?: string | null
          mood_change?: string | null
          photos?: string[] | null
          post_sleep?: string | null
          post_stress?: number | null
          pre_sleep?: string | null
          pre_stress?: number | null
          recommendation_id?: string | null
          user_id?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_records_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
