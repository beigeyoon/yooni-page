import { Session } from "next-auth";

export interface ExtendedSession extends Session {
  accessToken?: string;
  user?: Session["user"] & {
    id?: string;
  };
}

export interface PostFormValues {
  title?: string;
  subtitle?: string;
  category?: 'TRAVEL' | 'DEV' | 'PROJECT' | 'PHOTO' | 'TALK';
  isPublished?: boolean;
  content?: string;
}

export interface PostPayload extends PostFormValues {
  userId: string;
}