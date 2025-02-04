import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function EditorLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex gap-12 p-12">
      <section className="flex-1">{children}</section>
      <section className="flex flex-col gap-4">
        <Select>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="TRAVEL">TRAVEL</SelectItem>
              <SelectItem value="DEV">DEV</SelectItem>
              <SelectItem value="PROJECT">PROJECT</SelectItem>
              <SelectItem value="PHOTO">PHOTO</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button variant="outline">임시저장</Button>
        <Button>작성완료</Button>
      </section>
    </div>
  );
}
