import { LoaderCircle } from 'lucide-react';

export const Loading = () => {
  return (
    <div className="flex w-full flex-col items-center gap-4 pt-10">
      <LoaderCircle className="animate-spin" />
      Loading...
    </div>
  );
};
