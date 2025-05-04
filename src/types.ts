import { Session } from "next-auth";

export interface ExtendedSession extends Session {
  accessToken?: string;
  user?: Session["user"] & {
    id?: string;
  };
}

export type Category = 'TRAVEL' | 'DEV' | 'PROJECT' | 'PHOTO' | 'TALK';

export interface PostFormValues {
  title?: string;
  subtitle?: string;
  category?: Category;
  isPublished?: boolean;
  content?: string;
}

export interface PostPayload extends PostFormValues {
  userId: string;
};

export interface Post {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  content: string;
  isPublished: boolean;
  userId: string;
  createdAt: string;
};