import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.email && (process.env.NEXT_PUBLIC_ADMIN_EMAIL === session.user.email);

  return {
    session,
    status,
    isAdmin,
  };
}