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
  public: {
    Tables: {
      articles: {
        Row: {
          attachments: Json
          author_id: string | null
          category: string
          content: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          id: string
          is_private: boolean
          published: boolean
          published_at: string | null
          scheduled_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_id?: string | null
          category?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          is_private?: boolean
          published?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_id?: string | null
          category?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          is_private?: boolean
          published?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audio_items: {
        Row: {
          audio_url: string
          author: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          image_url: string | null
          in_radio: boolean
          kind: string
          published: boolean
          published_at: string | null
          sort_order: number
          source_label: string | null
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url: string
          author?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          image_url?: string | null
          in_radio?: boolean
          kind?: string
          published?: boolean
          published_at?: string | null
          sort_order?: number
          source_label?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string
          author?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          image_url?: string | null
          in_radio?: boolean
          kind?: string
          published?: boolean
          published_at?: string | null
          sort_order?: number
          source_label?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_subscribers: {
        Row: {
          active: boolean
          confirm_token: string
          confirmed_at: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_newsletter_at: string | null
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_newsletter_at?: string | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_newsletter_at?: string | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          budget: string | null
          created_at: string
          deadline: string | null
          description: string
          email: string
          full_name: string
          id: string
          ip_address: string | null
          is_read: boolean
          phone: string | null
          project_type: string
          structure: string | null
          user_agent: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          budget?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          email: string
          full_name: string
          id?: string
          ip_address?: string | null
          is_read?: boolean
          phone?: string | null
          project_type: string
          structure?: string | null
          user_agent?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          budget?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          is_read?: boolean
          phone?: string | null
          project_type?: string
          structure?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      content_feedback: {
        Row: {
          comment: string | null
          content_key: string
          content_title: string | null
          content_type: string
          created_at: string
          email: string | null
          id: string
          paid_amount_cents: number | null
          payment_reference: string | null
          payment_status: string
          rating: number
          support_amount_cents: number | null
          updated_at: string
          user_agent: string | null
          visitor_hash: string | null
        }
        Insert: {
          comment?: string | null
          content_key: string
          content_title?: string | null
          content_type: string
          created_at?: string
          email?: string | null
          id?: string
          paid_amount_cents?: number | null
          payment_reference?: string | null
          payment_status?: string
          rating: number
          support_amount_cents?: number | null
          updated_at?: string
          user_agent?: string | null
          visitor_hash?: string | null
        }
        Update: {
          comment?: string | null
          content_key?: string
          content_title?: string | null
          content_type?: string
          created_at?: string
          email?: string | null
          id?: string
          paid_amount_cents?: number | null
          payment_reference?: string | null
          payment_status?: string
          rating?: number
          support_amount_cents?: number | null
          updated_at?: string
          user_agent?: string | null
          visitor_hash?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          bullets: Json
          created_at: string
          description: string | null
          extra_label: string | null
          extra_value: string | null
          icon: string | null
          id: string
          link_label: string | null
          logo_domain: string | null
          logo_url: string | null
          period: string | null
          published: boolean
          section: string
          sort_order: number
          subtitle: string | null
          tags: Json
          title: string
          updated_at: string
          url: string | null
          videos: Json
        }
        Insert: {
          bullets?: Json
          created_at?: string
          description?: string | null
          extra_label?: string | null
          extra_value?: string | null
          icon?: string | null
          id?: string
          link_label?: string | null
          logo_domain?: string | null
          logo_url?: string | null
          period?: string | null
          published?: boolean
          section: string
          sort_order?: number
          subtitle?: string | null
          tags?: Json
          title: string
          updated_at?: string
          url?: string | null
          videos?: Json
        }
        Update: {
          bullets?: Json
          created_at?: string
          description?: string | null
          extra_label?: string | null
          extra_value?: string | null
          icon?: string | null
          id?: string
          link_label?: string | null
          logo_domain?: string | null
          logo_url?: string | null
          period?: string | null
          published?: boolean
          section?: string
          sort_order?: number
          subtitle?: string | null
          tags?: Json
          title?: string
          updated_at?: string
          url?: string | null
          videos?: Json
        }
        Relationships: []
      }
      feedback_settings: {
        Row: {
          amounts_cents: Json
          comment_enabled: boolean
          confirmation_texts: Json
          created_at: string
          disabled_paths: Json
          enabled: boolean
          id: boolean
          min_amount_cents: number
          min_rating_for_support: number
          public_display: string
          questions: Json
          revolut_links: Json
          support_enabled: boolean
          updated_at: string
        }
        Insert: {
          amounts_cents?: Json
          comment_enabled?: boolean
          confirmation_texts?: Json
          created_at?: string
          disabled_paths?: Json
          enabled?: boolean
          id?: boolean
          min_amount_cents?: number
          min_rating_for_support?: number
          public_display?: string
          questions?: Json
          revolut_links?: Json
          support_enabled?: boolean
          updated_at?: string
        }
        Update: {
          amounts_cents?: Json
          comment_enabled?: boolean
          confirmation_texts?: Json
          created_at?: string
          disabled_paths?: Json
          enabled?: boolean
          id?: boolean
          min_amount_cents?: number
          min_rating_for_support?: number
          public_display?: string
          questions?: Json
          revolut_links?: Json
          support_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_runs: {
        Row: {
          article_count: number
          created_at: string
          id: string
          recipient_count: number
          sent_at: string
        }
        Insert: {
          article_count?: number
          created_at?: string
          id?: string
          recipient_count?: number
          sent_at?: string
        }
        Update: {
          article_count?: number
          created_at?: string
          id?: string
          recipient_count?: number
          sent_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string
          device: string | null
          id: string
          path: string
          referrer: string | null
          session_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          amount_cents: number
          carrier: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          environment: string
          error_message: string | null
          events: Json
          id: string
          items: Json
          printful_order_id: string | null
          printful_shipped_at: string | null
          printful_status: string | null
          printful_updated_at: string | null
          refunded_amount_cents: number
          refunded_at: string | null
          shipping: Json | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          carrier?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          environment?: string
          error_message?: string | null
          events?: Json
          id?: string
          items?: Json
          printful_order_id?: string | null
          printful_shipped_at?: string | null
          printful_status?: string | null
          printful_updated_at?: string | null
          refunded_amount_cents?: number
          refunded_at?: string | null
          shipping?: Json | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          carrier?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          environment?: string
          error_message?: string | null
          events?: Json
          id?: string
          items?: Json
          printful_order_id?: string | null
          printful_shipped_at?: string | null
          printful_status?: string | null
          printful_updated_at?: string | null
          refunded_amount_cents?: number
          refunded_at?: string | null
          shipping?: Json | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          active: boolean
          availability: string | null
          colors: Json
          created_at: string
          currency: string
          description: string
          id: string
          image_url: string | null
          images: Json
          name: string
          price_cents: number
          printful_external_id: string | null
          printful_print_file_url: string | null
          printful_product_id: number | null
          printful_source: string | null
          printful_sync_product_id: number | null
          printful_sync_variant_id: number | null
          printful_synced_at: string | null
          printful_variant_id: number | null
          sizes: Json
          slug: string
          sort_order: number
          updated_at: string
          variants: Json
        }
        Insert: {
          active?: boolean
          availability?: string | null
          colors?: Json
          created_at?: string
          currency?: string
          description?: string
          id?: string
          image_url?: string | null
          images?: Json
          name: string
          price_cents: number
          printful_external_id?: string | null
          printful_print_file_url?: string | null
          printful_product_id?: number | null
          printful_source?: string | null
          printful_sync_product_id?: number | null
          printful_sync_variant_id?: number | null
          printful_synced_at?: string | null
          printful_variant_id?: number | null
          sizes?: Json
          slug: string
          sort_order?: number
          updated_at?: string
          variants?: Json
        }
        Update: {
          active?: boolean
          availability?: string | null
          colors?: Json
          created_at?: string
          currency?: string
          description?: string
          id?: string
          image_url?: string | null
          images?: Json
          name?: string
          price_cents?: number
          printful_external_id?: string | null
          printful_print_file_url?: string | null
          printful_product_id?: number | null
          printful_source?: string | null
          printful_sync_product_id?: number | null
          printful_sync_variant_id?: number | null
          printful_synced_at?: string | null
          printful_variant_id?: number | null
          sizes?: Json
          slug?: string
          sort_order?: number
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
