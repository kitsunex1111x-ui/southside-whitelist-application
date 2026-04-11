export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string;
          user_id: string;
          char_name: string;
          discord: string;
          age: string;
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
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          char_name: string;
          discord: string;
          age: string;
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
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          char_name?: string;
          discord?: string;
          age?: string;
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
          reviewed_by?: string | null;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_id: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_id?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          target_id?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          username: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string;
          created_at?: string;
        };
      };
    };
    Enums: {
      application_status: "pending" | "accepted" | "rejected";
      app_role: "admin" | "owner";
    };
  };
};
