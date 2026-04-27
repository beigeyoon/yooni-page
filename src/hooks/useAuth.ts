import { useSession } from 'next-auth/react';
import { ExtendedSession } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();
  const extendedSession = session as ExtendedSession | null;
  const isAdmin = Boolean(extendedSession?.user?.isAdmin);

  return {
    session: extendedSession,
    status,
    isAdmin
  };
}
