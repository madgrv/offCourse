export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      diet_days: {
        Row: {
          day_of_week: string
          diet_plan_id: string | null
          id: string
          total_calories: number | null
        }
        Insert: {
          day_of_week: string
          diet_plan_id?: string | null
          id?: string
          total_calories?: number | null
        }
        Update: {
          day_of_week?: string
          diet_plan_id?: string | null
          id?: string
          total_calories?: number | null
        }
        Relationships: []
      }
      diet_food_items: {
        Row: {
          calories: number
          carbohydrates: number
          diet_meal_id: string
          fat: number
          food_name: string
          id: number
          protein: number
          sugars: number
        }
        Insert: {
          calories: number
          carbohydrates: number
          diet_meal_id: string
          fat: number
          food_name: string
          id?: never
          protein: number
          sugars: number
        }
        Update: {
          calories?: number
          carbohydrates?: number
          diet_meal_id?: string
          fat?: number
          food_name?: string
          id?: never
          protein?: number
          sugars?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_food_items_diet_meal_id_fkey"
            columns: ["diet_meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_meals: {
        Row: {
          diet_day_id: string | null
          id: string
          meal_type: string
        }
        Insert: {
          diet_day_id?: string | null
          id?: string
          meal_type: string
        }
        Update: {
          diet_day_id?: string | null
          id?: string
          meal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_meals_diet_day_id_fkey"
            columns: ["diet_day_id"]
            isOneToOne: false
            referencedRelation: "diet_days"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_template: boolean
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_template?: boolean
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_template?: boolean
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          calories: number | null
          carbohydrates: number | null
          fat: number | null
          food_name: string
          id: string
          meal_id: string | null
          protein: number | null
          sugars: number | null
        }
        Insert: {
          calories?: number | null
          carbohydrates?: number | null
          fat?: number | null
          food_name: string
          id?: string
          meal_id?: string | null
          protein?: number | null
          sugars?: number | null
        }
        Update: {
          calories?: number | null
          carbohydrates?: number | null
          fat?: number | null
          food_name?: string
          id?: string
          meal_id?: string | null
          protein?: number | null
          sugars?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      food_reference: {
        Row: {
          calories: number | null
          description: string | null
          food: string
        }
        Insert: {
          calories?: number | null
          description?: string | null
          food: string
        }
        Update: {
          calories?: number | null
          description?: string | null
          food?: string
        }
        Relationships: []
      }
      meal_ingredients: {
        Row: {
          food_item_id: string
          id: string
          meal_id: string
          quantity: number
        }
        Insert: {
          food_item_id: string
          id?: string
          meal_id: string
          quantity: number
        }
        Update: {
          food_item_id?: string
          id?: string
          meal_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_ingredients_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_ingredients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          meal_name: string | null
          meal_type: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          meal_name?: string | null
          meal_type?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          meal_name?: string | null
          meal_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_meal_progress: {
        Row: {
          completed_at: string | null
          diet_day_id: string
          diet_plan_id: string
          id: string
          meal_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          diet_day_id: string
          diet_plan_id: string
          id?: string
          meal_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          diet_day_id?: string
          diet_plan_id?: string
          id?: string
          meal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_meal_progress_diet_day_id_fkey"
            columns: ["diet_day_id"]
            isOneToOne: false
            referencedRelation: "diet_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_meal_progress_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_meal_progress_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          age: number | null
          created_at: string | null
          email: string | null
          gender: string | null
          goal: string | null
          height: number | null
          id: string
          name: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          id: string
          name?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          name?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      user_selected_diet: {
        Row: {
          diet_plan_id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          diet_plan_id: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          diet_plan_id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
