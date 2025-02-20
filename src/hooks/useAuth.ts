import { useSession } from "next-auth/react";
import { ExtendedSession } from "@/types";

export function useAuth() {
  const { data: session, status } = useSession();
  const extendedSession = session as ExtendedSession | null;
  const isAdmin = session?.user?.email && (process.env.NEXT_PUBLIC_ADMIN_EMAIL === session.user.email);

  return {
    session: extendedSession,
    status,
    isAdmin,
  };
}