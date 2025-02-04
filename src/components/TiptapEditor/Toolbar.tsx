import { Editor } from '@tiptap/react';
import { Button } from '../ui/button';
import {
  LucideIcon,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Image
} from 'lucide-react';
import { useRef } from 'react';
import uploadImage from '@/utils/uploadImage';

export default function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
      }
    }
  };

  const buttons: { type: string; icon: LucideIcon; onClick: () => void }[] = [
    {
      type: 'heading1',
      icon: Heading1,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      type: 'heading2',
      icon: Heading2,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      type: 'heading3',
      icon: Heading3,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      type: 'bold',
      icon: Bold,
      onClick: () => editor.chain().focus().toggleBold().run()
    },
    {
      type: 'italic',
      icon: Italic,
      onClick: () => editor.chain().focus().toggleItalic().run()
    },
    {
      type: 'strike',
      icon: Strikethrough,
      onClick: () => editor.chain().focus().toggleStrike().run()
    },
    {
      type: 'code',
      icon: Code,
      onClick: () => editor.chain().focus().toggleCode().run()
    },
    {
      type: 'bulletList',
      icon: List,
      onClick: () => editor.chain().focus().toggleBulletList().run()
    },
    {
      type: 'orderedList',
      icon: ListOrdered,
      onClick: () => editor.chain().focus().toggleOrderedList().run()
    },
    {
      type: 'blockquote',
      icon: Quote,
      onClick: () => editor.chain().focus().toggleBlockquote().run()
    },
    {
      type: 'codeBlock',
      icon: Code2,
      onClick: () => editor.chain().focus().toggleCodeBlock().run()
    },
    {
      type: 'horizontalRule',
      icon: Minus,
      onClick: () => editor.chain().focus().setHorizontalRule().run()
    },
    {
      type: 'image',
      icon: Image,
      onClick: () => fileInputRef.current?.click()
    }
  ];

  return (
    <div className="border-neutral-500-100 mb-4 border-b border-neutral-400 pb-2">
      {buttons.map(({ type, icon: Icon, onClick }) => (
        <Button
          key={type}
          onClick={onClick}
          variant="ghost"
          size="sm"
          className={`px-2 ${editor.isActive(type) && 'bg-slate-200'}`}>
          <Icon />
          {type === 'image' && (
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          )}
        </Button>
      ))}
    </div>
  );
}
