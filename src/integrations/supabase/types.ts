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
      flamme_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          moderation_status: string
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          moderation_status?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          moderation_status?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "flamme_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "flamme_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_conversation_keys: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          iv: string
          recipient_device_id: string
          recipient_user_id: string
          sender_device_id: string
          wrapped_key: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          iv: string
          recipient_device_id: string
          recipient_user_id: string
          sender_device_id: string
          wrapped_key: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          iv?: string
          recipient_device_id?: string
          recipient_user_id?: string
          sender_device_id?: string
          wrapped_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_conversation_keys_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "flamme_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_conversation_keys_recipient_device_id_fkey"
            columns: ["recipient_device_id"]
            isOneToOne: false
            referencedRelation: "flamme_device_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_conversation_keys_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_conversation_keys_sender_device_id_fkey"
            columns: ["sender_device_id"]
            isOneToOne: false
            referencedRelation: "flamme_device_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "flamme_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kind: string
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kind?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flamme_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_device_keys: {
        Row: {
          created_at: string
          id: string
          label: string
          last_seen_at: string
          public_jwk: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          last_seen_at?: string
          public_jwk: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          last_seen_at?: string
          public_jwk?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_device_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "flamme_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_events: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          group_id: string | null
          id: string
          image_path: string | null
          place: string | null
          starts_at: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string
          group_id?: string | null
          id?: string
          image_path?: string | null
          place?: string | null
          starts_at: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          group_id?: string | null
          id?: string
          image_path?: string | null
          place?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "flamme_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_forum_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_anonymous: boolean
          moderation_status: string
          reply_to_id: string | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          moderation_status?: string
          reply_to_id?: string | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          moderation_status?: string
          reply_to_id?: string | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_forum_replies_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "flamme_forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "flamme_forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_forum_topics: {
        Row: {
          author_id: string
          body: string
          category: string
          created_at: string
          id: string
          is_anonymous: boolean
          is_locked: boolean
          is_pinned: boolean
          moderation_status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          category?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          moderation_status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          moderation_status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_forum_topics_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "flamme_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_groups: {
        Row: {
          created_at: string
          description: string
          id: string
          image_path: string | null
          name: string
          owner_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          name: string
          owner_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_messages: {
        Row: {
          ciphertext: string
          conversation_id: string
          created_at: string
          id: string
          iv: string
          sender_device_id: string
          sender_id: string
        }
        Insert: {
          ciphertext: string
          conversation_id: string
          created_at?: string
          id?: string
          iv: string
          sender_device_id: string
          sender_id: string
        }
        Update: {
          ciphertext?: string
          conversation_id?: string
          created_at?: string
          id?: string
          iv?: string
          sender_device_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "flamme_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_messages_sender_device_id_fkey"
            columns: ["sender_device_id"]
            isOneToOne: false
            referencedRelation: "flamme_device_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_moderation_actions: {
        Row: {
          action: string
          actor_id: string | null
          categories: Json
          created_at: string
          id: string
          reason: string
          source: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          categories?: Json
          created_at?: string
          id?: string
          reason?: string
          source?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          categories?: Json
          created_at?: string
          id?: string
          reason?: string
          source?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      flamme_notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          payload: Json
          read_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "flamme_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_post_media: {
        Row: {
          bucket: string
          created_at: string
          id: string
          media_type: string
          path: string
          position: number
          post_id: string
        }
        Insert: {
          bucket?: string
          created_at?: string
          id?: string
          media_type: string
          path: string
          position?: number
          post_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          media_type?: string
          path?: string
          position?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "flamme_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          group_id: string | null
          id: string
          is_anonymous: boolean
          kind: string
          moderation_status: string
          poll: Json | null
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_anonymous?: boolean
          kind?: string
          moderation_status?: string
          poll?: Json | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_anonymous?: boolean
          kind?: string
          moderation_status?: string
          poll?: Json | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "flamme_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_profiles: {
        Row: {
          allow_messages: string
          avatar_path: string | null
          bio: string
          city: string | null
          cover_path: string | null
          created_at: string
          display_name: string
          handle: string
          id: string
          is_private: boolean
          is_verified: boolean
          last_seen_at: string
          show_online: boolean
          updated_at: string
          website: string | null
        }
        Insert: {
          allow_messages?: string
          avatar_path?: string | null
          bio?: string
          city?: string | null
          cover_path?: string | null
          created_at?: string
          display_name: string
          handle: string
          id: string
          is_private?: boolean
          is_verified?: boolean
          last_seen_at?: string
          show_online?: boolean
          updated_at?: string
          website?: string | null
        }
        Update: {
          allow_messages?: string
          avatar_path?: string | null
          bio?: string
          city?: string | null
          cover_path?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          is_private?: boolean
          is_verified?: boolean
          last_seen_at?: string
          show_online?: boolean
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      flamme_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "flamme_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_reports: {
        Row: {
          ai_categories: Json
          ai_checked_at: string | null
          ai_decision: string | null
          ai_reason: string | null
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          ai_categories?: Json
          ai_checked_at?: string | null
          ai_decision?: string | null
          ai_reason?: string | null
          created_at?: string
          details?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          ai_categories?: Json
          ai_checked_at?: string | null
          ai_decision?: string | null
          ai_reason?: string | null
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_saved_items: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_saved_items_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "flamme_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_stories: {
        Row: {
          author_id: string
          background: string
          created_at: string
          expires_at: string
          id: string
          is_anonymous: boolean
          moderation_status: string
          text: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id: string
          background?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_anonymous?: boolean
          moderation_status?: string
          text?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          background?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_anonymous?: boolean
          moderation_status?: string
          text?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_story_media: {
        Row: {
          bucket: string
          created_at: string
          id: string
          media_type: string
          path: string
          story_id: string
        }
        Insert: {
          bucket?: string
          created_at?: string
          id?: string
          media_type: string
          path: string
          story_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          media_type?: string
          path?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_story_media_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "flamme_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      flamme_story_views: {
        Row: {
          id: string
          story_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flamme_story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "flamme_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flamme_story_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flamme_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      portfolio_items: {
        Row: {
          category: string
          client: string | null
          cover_url: string | null
          created_at: string
          description: string
          id: string
          images: Json
          link_url: string | null
          published: boolean
          sort_order: number
          tags: Json
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string
          client?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: Json
          link_url?: string | null
          published?: boolean
          sort_order?: number
          tags?: Json
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string
          client?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: Json
          link_url?: string | null
          published?: boolean
          sort_order?: number
          tags?: Json
          title?: string
          updated_at?: string
          year?: number | null
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
      flamme_can_message: {
        Args: { recipient: string; sender: string }
        Returns: boolean
      }
      flamme_can_read_private_object: {
        Args: { object_name: string; u?: string }
        Returns: boolean
      }
      flamme_can_view_event: {
        Args: { e: string; u?: string }
        Returns: boolean
      }
      flamme_can_view_post: {
        Args: { p: string; u?: string }
        Returns: boolean
      }
      flamme_can_view_story: {
        Args: { s: string; u?: string }
        Returns: boolean
      }
      flamme_expected_follow_status: {
        Args: { target: string }
        Returns: string
      }
      flamme_is_admin: { Args: { u?: string }; Returns: boolean }
      flamme_is_blocked: { Args: { a: string; b: string }; Returns: boolean }
      flamme_is_contact: { Args: { a: string; b: string }; Returns: boolean }
      flamme_is_conversation_member: {
        Args: { c: string; u: string }
        Returns: boolean
      }
      flamme_is_group_member: {
        Args: { g: string; u: string }
        Returns: boolean
      }
      flamme_is_group_moderator: {
        Args: { g: string; u: string }
        Returns: boolean
      }
      flamme_is_group_owner: {
        Args: { g: string; u: string }
        Returns: boolean
      }
      flamme_ranked_feed: {
        Args: { p_before?: string; p_contacts_only?: boolean; p_limit?: number }
        Returns: {
          created_at: string
          post_id: string
          score: number
        }[]
      }
      flamme_set_verified: {
        Args: { target_user: string; verified: boolean }
        Returns: boolean
      }
      flamme_valid_poll_vote: {
        Args: { option_no: number; p: string; u: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
