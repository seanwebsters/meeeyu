export type Vibe =
  | "soft"
  | "bold"
  | "dreamy"
  | "retro"
  | "minimal"
  | "playful"
  | "indie"
  | "y2k"
  | "cute";

export type BackgroundKey =
  | "classic"
  | "dreamy"
  | "midnight"
  | "sunset"
  | "mint"
  | "y2k";

export type CardType =
  | "photo"
  | "music"
  | "film"
  | "place"
  | "book"
  | "food"
  | "quote"
  | "fact"
  | "mood"
  | "obsession"
  | "person"
  | "thing"
  | "outfit"
  | "memory"
  | "custom";

// These are plain `type` aliases (not `interface`s) because TypeScript only
// grants object-literal types an implicit string index signature — required
// for them to satisfy Supabase's `GenericTable` (`Row`/`Insert`/`Update` must
// be assignable to `Record<string, unknown>`) when used below in `Database`.

export type CardContent = {
  text?: string;
  subtitle?: string;
  url?: string;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  vibe: Vibe;
  background: BackgroundKey;
  is_premium: boolean;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileCard = {
  id: string;
  profile_id: string;
  type: CardType;
  title: string | null;
  content: CardContent;
  position: number;
  rotation: number;
  created_at: string;
  updated_at: string;
};

export type Prompt = {
  id: string;
  question: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
};

export type PromptSelfAnswer = {
  id: string;
  profile_id: string;
  prompt_id: string;
  answer: string;
  created_at: string;
};

export type PromptFriendAnswer = {
  id: string;
  profile_id: string;
  prompt_id: string;
  responder_id: string | null;
  responder_name: string | null;
  answer: string;
  is_anonymous: boolean;
  share_token: string | null;
  created_at: string;
};

export type ShareLink = {
  id: string;
  token: string;
  profile_id: string;
  prompt_id: string | null;
  created_at: string;
};

export type Reaction = {
  id: string;
  profile_id: string;
  card_id: string | null;
  reactor_id: string | null;
  emoji: string;
  created_at: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

// Minimal Supabase Database type — hand-authored to match supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once a live project exists.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      profile_cards: {
        Row: ProfileCard;
        Insert: Partial<ProfileCard> & { profile_id: string; type: CardType };
        Update: Partial<ProfileCard>;
        Relationships: [];
      };
      prompts: {
        Row: Prompt;
        Insert: Partial<Prompt> & { question: string };
        Update: Partial<Prompt>;
        Relationships: [];
      };
      prompt_self_answers: {
        Row: PromptSelfAnswer;
        Insert: Partial<PromptSelfAnswer> & {
          profile_id: string;
          prompt_id: string;
          answer: string;
        };
        Update: Partial<PromptSelfAnswer>;
        Relationships: [];
      };
      prompt_friend_answers: {
        Row: PromptFriendAnswer;
        Insert: Partial<PromptFriendAnswer> & {
          profile_id: string;
          prompt_id: string;
          answer: string;
        };
        Update: Partial<PromptFriendAnswer>;
        Relationships: [];
      };
      share_links: {
        Row: ShareLink;
        Insert: Partial<ShareLink> & { profile_id: string };
        Update: Partial<ShareLink>;
        Relationships: [];
      };
      reactions: {
        Row: Reaction;
        Insert: Partial<Reaction> & { profile_id: string; emoji: string };
        Update: Partial<Reaction>;
        Relationships: [];
      };
      follows: {
        Row: Follow;
        Insert: Partial<Follow> & { follower_id: string; following_id: string };
        Update: Partial<Follow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
