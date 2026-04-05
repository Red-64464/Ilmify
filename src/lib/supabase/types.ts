export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          role: 'admin' | 'user';
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          role?: 'admin' | 'user';
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string;
          role?: 'admin' | 'user';
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string;
          cover_url: string | null;
          description: string;
          category: string;
          language: string;
          isbn: string | null;
          status: 'to-read' | 'reading' | 'read';
          progress: number | null;
          rating: number | null;
          tags: string[];
          personal_notes: string | null;
          passage_count: number;
          started_at: string | null;
          finished_at: string | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          author: string;
          cover_url?: string | null;
          description?: string;
          category?: string;
          language?: string;
          isbn?: string | null;
          status?: 'to-read' | 'reading' | 'read';
          progress?: number | null;
          rating?: number | null;
          tags?: string[];
          personal_notes?: string | null;
          passage_count?: number;
          started_at?: string | null;
          finished_at?: string | null;
          added_at?: string;
        };
        Update: {
          title?: string;
          author?: string;
          cover_url?: string | null;
          description?: string;
          category?: string;
          language?: string;
          isbn?: string | null;
          status?: 'to-read' | 'reading' | 'read';
          progress?: number | null;
          rating?: number | null;
          tags?: string[];
          personal_notes?: string | null;
          passage_count?: number;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Relationships: [];
      };
      book_passages: {
        Row: {
          id: string;
          book_id: string;
          user_id: string;
          title: string;
          content: string;
          personal_reflection: string | null;
          page_number: number | null;
          tags: string[];
          is_favorite: boolean;
          is_important: boolean;
          theme_id: string | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          user_id: string;
          title: string;
          content: string;
          personal_reflection?: string | null;
          page_number?: number | null;
          tags?: string[];
          is_favorite?: boolean;
          is_important?: boolean;
          theme_id?: string | null;
          added_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          personal_reflection?: string | null;
          page_number?: number | null;
          tags?: string[];
          is_favorite?: boolean;
          is_important?: boolean;
          theme_id?: string | null;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          icon: string | null;
          cover_image: string | null;
          blocks: Json;
          tags: string[];
          category: string | null;
          is_pinned: boolean;
          is_favorite: boolean;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          icon?: string | null;
          cover_image?: string | null;
          blocks?: Json;
          tags?: string[];
          category?: string | null;
          is_pinned?: boolean;
          is_favorite?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          icon?: string | null;
          cover_image?: string | null;
          blocks?: Json;
          tags?: string[];
          category?: string | null;
          is_pinned?: boolean;
          is_favorite?: boolean;
          is_archived?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_folders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          icon: string | null;
          parent_id: string | null;
          order_num: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          order_num?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          order_num?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_pages: {
        Row: {
          id: string;
          folder_id: string;
          user_id: string;
          title: string;
          description: string | null;
          blocks: Json;
          tags: string[];
          icon: string | null;
          cover_image: string | null;
          order_num: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          folder_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          blocks?: Json;
          tags?: string[];
          icon?: string | null;
          cover_image?: string | null;
          order_num?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          blocks?: Json;
          tags?: string[];
          icon?: string | null;
          cover_image?: string | null;
          order_num?: number;
          folder_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      flashcard_decks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          theme_id: string | null;
          card_count: number;
          mastered_count: number;
          color: string;
          icon: string | null;
          last_studied_at: string | null;
          to_review_count: number;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          theme_id?: string | null;
          card_count?: number;
          mastered_count?: number;
          color?: string;
          icon?: string | null;
          last_studied_at?: string | null;
          to_review_count?: number;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          theme_id?: string | null;
          card_count?: number;
          mastered_count?: number;
          color?: string;
          icon?: string | null;
          last_studied_at?: string | null;
          to_review_count?: number;
          tags?: string[];
        };
        Relationships: [];
      };
      flashcards: {
        Row: {
          id: string;
          deck_id: string;
          user_id: string;
          front: string;
          back: string;
          tags: string[];
          difficulty: 'easy' | 'medium' | 'hard';
          mastery_level: number;
          next_review_at: string | null;
          review_count: number;
          theme_id: string | null;
          last_reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          user_id: string;
          front: string;
          back: string;
          tags?: string[];
          difficulty?: 'easy' | 'medium' | 'hard';
          mastery_level?: number;
          next_review_at?: string | null;
          review_count?: number;
          theme_id?: string | null;
          last_reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          front?: string;
          back?: string;
          tags?: string[];
          difficulty?: 'easy' | 'medium' | 'hard';
          mastery_level?: number;
          next_review_at?: string | null;
          review_count?: number;
          theme_id?: string | null;
          last_reviewed_at?: string | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          item_type: string;
          item_id: string;
          title: string | null;
          preview: string | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: string;
          item_id: string;
          title?: string | null;
          preview?: string | null;
          added_at?: string;
        };
        Update: {
          title?: string | null;
          preview?: string | null;
        };
        Relationships: [];
      };
      quiz_questions: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string | null;
          type: string;
          question: string;
          options: Json;
          correct_answer: Json;
          explanation: string;
          source: string | null;
          difficulty: string;
          mastery_level: number;
          error_count: number;
          review_count: number;
          last_reviewed_at: string | null;
          tags: string[];
          proof: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme_id?: string | null;
          type?: string;
          question: string;
          options?: Json;
          correct_answer: Json;
          explanation?: string;
          source?: string | null;
          difficulty?: string;
          mastery_level?: number;
          error_count?: number;
          review_count?: number;
          last_reviewed_at?: string | null;
          tags?: string[];
          proof?: string | null;
          created_at?: string;
        };
        Update: {
          theme_id?: string | null;
          type?: string;
          question?: string;
          options?: Json;
          correct_answer?: Json;
          explanation?: string;
          source?: string | null;
          difficulty?: string;
          mastery_level?: number;
          error_count?: number;
          review_count?: number;
          last_reviewed_at?: string | null;
          tags?: string[];
          proof?: string | null;
        };
        Relationships: [];
      };
      quiz_sessions: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string | null;
          questions: string[];
          answers: Json;
          score: number;
          total: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme_id?: string | null;
          questions?: string[];
          answers?: Json;
          score: number;
          total: number;
          completed_at?: string;
        };
        Update: {
          theme_id?: string | null;
          questions?: string[];
          answers?: Json;
          score?: number;
          total?: number;
        };
        Relationships: [];
      };
      user_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          activity_type: string;
          count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date: string;
          activity_type: string;
          count?: number;
        };
        Update: {
          activity_date?: string;
          activity_type?: string;
          count?: number;
        };
        Relationships: [];
      };
      media_folders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          icon: string | null;
          parent_id: string | null;
          order_num: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          order_num?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          order_num?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_videos: {
        Row: {
          id: string;
          folder_id: string;
          user_id: string;
          title: string;
          url: string;
          thumbnail_url: string | null;
          channel_name: string | null;
          duration: string | null;
          notes: Json;
          tags: string[];
          watched: boolean;
          order_num: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          folder_id: string;
          user_id: string;
          title: string;
          url: string;
          thumbnail_url?: string | null;
          channel_name?: string | null;
          duration?: string | null;
          notes?: Json;
          tags?: string[];
          watched?: boolean;
          order_num?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          url?: string;
          thumbnail_url?: string | null;
          channel_name?: string | null;
          duration?: string | null;
          notes?: Json;
          tags?: string[];
          watched?: boolean;
          order_num?: number;
          folder_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
