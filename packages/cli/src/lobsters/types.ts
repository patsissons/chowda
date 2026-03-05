export type LobstersStory = {
  short_id: string;
  score: number;
  comment_count: number;
  title: string;
  url?: string;
  comments_url?: string;
  submitter_user?: string;
  tags?: string[];
  comments?: Array<{
    short_id: string;
    score?: number;
    depth?: number;
    commenting_user: string;
    comment_plain?: string;
  }>;
};

export type LobstersTag = {
  tag: string;
  category: string;
  active: boolean;
  description?: string;
};

export type LobstersUser = {
  username?: string;
  karma?: number;
  created_at?: string;
  is_admin?: boolean;
  is_moderator?: boolean;
  invited_by_user?: string;
  github_username?: string;
  avatar_url?: string;
};
