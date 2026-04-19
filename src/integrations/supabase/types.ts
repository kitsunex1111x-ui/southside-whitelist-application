export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string;
          user_id: string;
          type: string | null;
          char_name: string;
          discord: string;
          age: number;              // INTEGER in DB
          backstory: string;
          traits: string;
          metagaming: string;
          powergaming: string;
          rdm: string;
          vdm: string;
          real_name: string;
          status: Database["public"]["Enums"]["application_status"];
          created_at: string;
          updated_at: string;
          admin_notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string | null;
          char_name: string;
          discord: string;
          age: number;
          backstory: string;
          traits: string;
          metagaming: string;
          powergaming: string;
          rdm: string;
          vdm: string;
          real_name: string;
          status?: Database["public"]["Enums"]["application_status"];
          created_at?: string;
          updated_at?: string;
          admin_notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string | null;
          char_name?: string;
          discord?: string;
          age?: number;
          backstory?: string;
          traits?: string;
          metagaming?: string;
          powergaming?: string;
          rdm?: string;
          vdm?: string;
          real_name?: string;
          status?: Database["public"]["Enums"]["application_status"];
          created_at?: string;
          updated_at?: string;
          admin_notes?: string | null;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          updated_at?: string | null;
        };
      };
      admin_logs: {
        Row: {
          id: string;
          actor_user_id: string;
          action: string;
          target_id: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id: string;
          action: string;
          target_id?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string;
          action?: string;
          target_id?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
    };
    Enums: {
      application_status: "pending" | "accepted" | "rejected";
      app_role: "admin" | "owner" | "accepted" | "user";
    };
  };
};
