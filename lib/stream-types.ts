export type StreamCommentView = {
  id: string;
  body: string;
  createdAt: string;
  author: { username: string; displayName: string | null; avatarUrl: string | null };
};

export type StreamPostView = {
  id: string;
  kind: "status" | "thesis";
  body: string;
  tickers: string[];
  hasPhoto: boolean;
  createdAt: string;
  author: { username: string; displayName: string | null; avatarUrl: string | null };
  likes: number;
  liked: boolean;
  comments: number;
  recentComments: StreamCommentView[];
};
