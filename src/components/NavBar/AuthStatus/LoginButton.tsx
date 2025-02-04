import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import Image from 'next/image';
import { signIn } from 'next-auth/react';

export function LoginButton() {
  const googleLogin = () => {
    signIn('google');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link">Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
          <DialogDescription>
            구글 계정으로 로그인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={googleLogin}>
            <Image
              src="/svgs/google.svg"
              alt="google-icon"
              width={20}
              height={20}
            />
            Login with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
