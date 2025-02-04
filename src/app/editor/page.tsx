'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Editor() {
  const { isAdmin, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !isAdmin) router.push('/');
  }, [isAdmin, router, status]);

  if (isAdmin) return <h1>Editor</h1>;
}
