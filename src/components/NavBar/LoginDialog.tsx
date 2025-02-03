import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

export function LoginDialog() {
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
        <div className="grid gap-4 py-4"></div>
      </DialogContent>
    </Dialog>
  );
}
