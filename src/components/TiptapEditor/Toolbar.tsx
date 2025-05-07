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
  Image,
  Link,
  MapPinned
} from 'lucide-react';
import { useRef } from 'react';
import uploadImage from '@/utils/uploadImage';

export default function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMultipleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const url = await uploadImage(file);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length === 0) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'imageGroup',
        content: uploadedUrls.map(url => ({
          type: 'image',
          attrs: { src: url }
        }))
      })
      .run();
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
    },
    {
      type: 'link',
      icon: Link,
      onClick: () => {
        const url = prompt('링크 URL을 입력하세요: ');
        if (url) {
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
        }
      }
    },
    {
      type: 'map',
      icon: MapPinned,
      onClick: () => {
        const src = prompt(
          '구글맵 embed src 주소를 입력하세요 (iframe src 속성)'
        );
        if (src) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (editor.chain() as any)
            .setIframe({
              src
            })
            .run();
        }
      }
    }
  ];

  return (
    <div className="border-neutral-500-100 mb-1 border-b border-neutral-400 pb-2">
      {buttons.map(({ type, icon: Icon, onClick }) => (
        <Button
          key={type}
          onClick={onClick}
          variant="ghost"
          size="sm"
          type="button"
          className={`px-2 ${editor.isActive(type) && 'bg-slate-200'}`}>
          <Icon />
          {type === 'image' && (
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleMultipleImageUpload}
              style={{ display: 'none' }}
            />
          )}
        </Button>
      ))}
    </div>
  );
}
