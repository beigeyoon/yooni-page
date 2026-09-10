import { Session } from "next-auth";

export interface ExtendedSession extends Session {
  accessToken?: string;
  user?: Session["user"] & {
    id?: string;
    isAdmin?: boolean;
  };
}

export const CATEGORIES = ['travel', 'dev', 'talk', 'photo'] as const;
export type Category = (typeof CATEGORIES)[number];

export function isValidCategory(value: unknown): value is Category {
  return (
    typeof value === 'string' &&
    (CATEGORIES as readonly string[]).includes(value)
  );
}

export interface PostFormValues {
  title?: string;
  subtitle?: string;
  category?: Category;
  seriesId?: string;
  seriesOrder?: number | null;
  isPublished?: boolean;
  content?: string;
}

export interface PostPayload extends PostFormValues {
  userId: string;
  id?: string;
};

export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  seriesId?: string;
  seriesOrder?: number | null;
  content: string;
  isPublished: boolean;
  userId: string;
  createdAt: string;
  // 최초 게시 시각. 초안은 null. 화면에 노출하는 날짜는 이 값이다.
  publishedAt: string | null;
};

// 목록 조회 결과. 목록 페이지는 조회 결과를 통째로 HTML에 dehydrate하므로
// 본문(content)은 대표 이미지를 뽑는 사진 목록에만 싣고 나머지 목록에서는 뺀다.
export type PostListItem = Omit<Post, 'content'> & { content?: string };

export interface CommentFormValues {
  content?: string;
};

export interface CommentPayload extends CommentFormValues {
  postId: string;
  userId: string;
  userName?: string;
  userImage?: string;
  id?: string;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  userName?: string;
  userImage?: string;
  createdAt: string;
};

export interface SeriesFormValues {
  title?: string;
  description?: string;
  category?: string;
}

export interface Series {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: string;
  // Supabase REST가 돌려주는 값이라 Date가 아니라 문자열이다. 해석은 utils/dbTimestamp.ts.
  createdAt: string;
};

export interface SeriesPayload extends SeriesFormValues {
  id?: string;
  createdAt?: string;
};

export interface ThoughtFormValues {
  content?: string;
};

export interface ThoughtPayload extends ThoughtFormValues {
  id?: string;
  createdAt?: string;
};

export interface Thought {
  id: string;
  content: string;
  createdAt: string;
};
