import { Session } from "next-auth";

export interface ExtendedSession extends Session {
  accessToken?: string;
  user?: Session["user"] & {
    id?: string;
  };
}

export type Category = 'travel' | 'dev' | 'talk' | 'photo';

export interface PostFormValues {
  title?: string;
  subtitle?: string;
  category?: Category;
  seriesId?: string;
  isPublished?: boolean;
  content?: string;
}

export interface PostPayload extends PostFormValues {
  userId: string;
  id?: string;
};

export interface Post {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  seriesId?: string;
  content: string;
  isPublished: boolean;
  userId: string;
  createdAt: string;
};

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