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
    <div>
      {status === 'authenticated' ? (
        <div className="flex items-center gap-2 max-sm:flex-col max-sm:pb-4">
          {isAdmin && (
            <Button
              onClick={() => router.push('/editor')}
              variant="ghost"
              className="p-2 text-neutral-400">
              <Pencil className="w-4" />
            </Button>
          )}
          <Label className="flex items-center gap-1 text-sm text-neutral-400 max-sm:hidden">
            <User className="w-4" />
            {session?.user?.name} ({session?.user?.email})
          </Label>
          <Label className="flex flex-col items-center text-neutral-400 sm:hidden">
            <div className="font-bold">{session?.user?.name}</div>
            <div>({session?.user?.email})</div>
          </Label>
          <Button
            variant="link"
            onClick={() => signOut()}
            className="max-sm:underline">
            Logout
          </Button>
        </div>
      ) : (
        <LoginButton />
      )}
    </div>
  );
}
