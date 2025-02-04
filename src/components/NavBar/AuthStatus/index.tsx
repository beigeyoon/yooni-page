'use client';

import { LoginButton } from './LoginButton';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { Label } from '@/components/ui/label';
import { User, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const { status, session, isAdmin } = useAuth();
  const router = useRouter();

  return (
    <>
      {status === 'authenticated' ? (
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              onClick={() => router.push('/editor')}
              variant="ghost"
              className="p-2 text-neutral-400">
              <Pencil className="w-4" />
            </Button>
          )}
          <Label className="flex items-center gap-1 text-sm text-neutral-400">
            <User className="w-4" />
            {session?.user?.name} ({session?.user?.email})
          </Label>
          <Button
            variant="link"
            onClick={() => signOut()}>
            Logout
          </Button>
        </div>
      ) : (
        <LoginButton />
      )}
    </>
  );
}
