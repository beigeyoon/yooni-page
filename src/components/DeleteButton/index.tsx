import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';

export function DeleteButton({ confirmDelete }: { confirmDelete: () => void }) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = () => {
    setIsDeleting(true);
    confirmDelete();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-fit cursor-pointer px-2 py-1 text-neutral-500 hover:text-neutral-700">
          <Trash2 width={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[280px]">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            <TriangleAlert className="mr-2 inline-block" />
          </DialogTitle>
          <DialogDescription className="py-2 text-center">
            정말로 삭제하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleDelete}>
          {isDeleting ? <LoaderCircle className="animate-spin" /> : '확인'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
