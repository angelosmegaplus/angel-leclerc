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
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          source: string
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          source?: string
          status?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      ai_actions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          payload: Json
          resolved_at: string | null
          sensitive: boolean
          status: string
          target_id: string | null
          target_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          payload?: Json
          resolved_at?: string | null
          sensitive?: boolean
          status?: string
          target_id?: string | null
          target_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          payload?: Json
          resolved_at?: string | null
          sensitive?: boolean
          status?: string
          target_id?: string | null
          target_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          author: string
          content: string
          context: Json
          created_at: string
          id: string
          response: string | null
          status: string
          updated_at: string
        }
        Insert: {
          author?: string
          content: string
          context?: Json
          created_at?: string
          id?: string
          response?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          context?: Json
          created_at?: string
          id?: string
          response?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      angel_os_cache: {
        Row: {
          key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          key: string
          payload: Json
          updated_at?: string
        }
        Update: {
          key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          city: string | null
          company: string
          contact_name: string | null
          created_at: string
          document_url: string | null
          email: string | null
          follow_up_at: string | null
          id: string
          notes: string | null
          phone: string | null
          position: string | null
          response: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          company: string
          contact_name?: string | null
          created_at?: string
          document_url?: string | null
          email?: string | null
          follow_up_at?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          response?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          company?: string
          contact_name?: string | null
          created_at?: string
          document_url?: string | null
          email?: string | null
          follow_up_at?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          response?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          ai_disclosure: Json
          attachments: Json
          author_id: string | null
          badges: Json
          category: string
          content: string
          cover_meta: Json
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
          sources: Json
          title: string
          topics: Json
          updated_at: string
        }
        Insert: {
          ai_disclosure?: Json
          attachments?: Json
          author_id?: string | null
          badges?: Json
          category?: string
          content?: string
          cover_meta?: Json
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
          sources?: Json
          title: string
          topics?: Json
          updated_at?: string
        }
        Update: {
          ai_disclosure?: Json
          attachments?: Json
          author_id?: string | null
          badges?: Json
          category?: string
          content?: string
          cover_meta?: Json
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
          sources?: Json
          title?: string
          topics?: Json
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
      contacts_sources: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          kind: string
          last_name: string
          notes: string | null
          organization: string | null
          phone: string | null
          role: string | null
          tags: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          kind?: string
          last_name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          tags?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          kind?: string
          last_name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          tags?: Json
          updated_at?: string
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
      film_taste_signals: {
        Row: {
          candidate_id: string
          completion: number
          director: string | null
          genre_ids: Json
          keywords: Json
          liked: boolean | null
          media_type: string
          people: Json
          rating: number | null
          rejected: boolean | null
          release_year: number | null
          seen: boolean | null
          style_fit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          candidate_id: string
          completion?: number
          director?: string | null
          genre_ids?: Json
          keywords?: Json
          liked?: boolean | null
          media_type: string
          people?: Json
          rating?: number | null
          rejected?: boolean | null
          release_year?: number | null
          seen?: boolean | null
          style_fit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          candidate_id?: string
          completion?: number
          director?: string | null
          genre_ids?: Json
          keywords?: Json
          liked?: boolean | null
          media_type?: string
          people?: Json
          rating?: number | null
          rejected?: boolean | null
          release_year?: number | null
          seen?: boolean | null
          style_fit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hourly_mail_reports: {
        Row: {
          counts: Json
          generated_at: string
          id: number
          items: Json
          period_end: string | null
          period_start: string | null
          recommendations: Json
          source: string
          summary: string
        }
        Insert: {
          counts?: Json
          generated_at?: string
          id?: number
          items?: Json
          period_end?: string | null
          period_start?: string | null
          recommendations?: Json
          source?: string
          summary: string
        }
        Update: {
          counts?: Json
          generated_at?: string
          id?: number
          items?: Json
          period_end?: string | null
          period_start?: string | null
          recommendations?: Json
          source?: string
          summary?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          contact_id: string | null
          created_at: string
          id: string
          media_url: string | null
          notes: string | null
          person: string | null
          questions: string | null
          reportage_id: string | null
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          notes?: string | null
          person?: string | null
          questions?: string | null
          reportage_id?: string | null
          scheduled_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          notes?: string | null
          person?: string | null
          questions?: string | null
          reportage_id?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_reportage_id_fkey"
            columns: ["reportage_id"]
            isOneToOne: false
            referencedRelation: "reportages"
            referencedColumns: ["id"]
          },
        ]
      }
      investigations: {
        Row: {
          created_at: string
          facts: string | null
          hypotheses: string | null
          id: string
          notes: string | null
          status: string
          summary: string | null
          timeline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          facts?: string | null
          hypotheses?: string | null
          id?: string
          notes?: string | null
          status?: string
          summary?: string | null
          timeline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          facts?: string | null
          hypotheses?: string | null
          id?: string
          notes?: string | null
          status?: string
          summary?: string | null
          timeline?: string | null
          title?: string
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
      notifications: {
        Row: {
          content: string | null
          created_at: string
          dedupe_key: string | null
          id: string
          is_read: boolean
          kind: string
          link: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title?: string
        }
        Relationships: []
      }
      oauth_connections: {
        Row: {
          account_label: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_sync_at: string | null
          provider: string
          scopes: string[]
          status: string
          token_ciphertext: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_label?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider: string
          scopes?: string[]
          status?: string
          token_ciphertext: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_label?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          scopes?: string[]
          status?: string
          token_ciphertext?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          event_name: string | null
          event_type: string
          id: string
          language: string | null
          metadata: Json
          os: string | null
          path: string
          referrer: string | null
          referrer_host: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string | null
          source: string | null
          title: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          viewport_height: number | null
          viewport_width: number | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          event_name?: string | null
          event_type?: string
          id?: string
          language?: string | null
          metadata?: Json
          os?: string | null
          path: string
          referrer?: string | null
          referrer_host?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string | null
          source?: string | null
          title?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          event_name?: string | null
          event_type?: string
          id?: string
          language?: string | null
          metadata?: Json
          os?: string | null
          path?: string
          referrer?: string | null
          referrer_host?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string | null
          source?: string | null
          title?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      press_review: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          project_id: string | null
          reportage_id: string | null
          source: string | null
          tags: Json
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          reportage_id?: string | null
          source?: string | null
          tags?: Json
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          reportage_id?: string | null
          source?: string | null
          tags?: Json
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "press_review_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "press_review_reportage_id_fkey"
            columns: ["reportage_id"]
            isOneToOne: false
            referencedRelation: "reportages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          amount_cents: number | null
          client_name: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          payment_status: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reportages: {
        Row: {
          article_id: string | null
          created_at: string
          event_date: string | null
          id: string
          location: string | null
          media_url: string | null
          notes: string | null
          project_id: string | null
          status: string
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          location?: string | null
          media_url?: string | null
          notes?: string | null
          project_id?: string | null
          status?: string
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          location?: string | null
          media_url?: string | null
          notes?: string | null
          project_id?: string | null
          status?: string
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportages_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
