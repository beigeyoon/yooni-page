import { Editor } from '@tiptap/react';
import { Button } from '../ui/button';
import {
  LucideIcon,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline,
  Palette,
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
import { useState } from 'react';
import ImageLayoutDialog, { type InsertedImage } from '../ImageLayoutDialog';
import extractEmbedSrc from '@/utils/extractEmbedSrc';

export default function Toolbar({ editor }: { editor: Editor }) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const handleInsertImages = (images: InsertedImage[], layout: string) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'imageGroup',
        attrs: { layout },
        // 빈 설명은 alt를 아예 빼서 상세 페이지의 자동 문구가 들어가게 한다
        content: images.map(({ src, alt }) => ({
          type: 'image',
          attrs: alt ? { src, alt } : { src }
        }))
      })
      .run();
  };

  const buttons: { type: string; icon: LucideIcon; onClick: () => void }[] = [
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
      type: 'underline',
      icon: Underline,
      onClick: () => editor.chain().focus().toggleUnderline().run()
    },
    {
      type: 'strike',
      icon: Strikethrough,
      onClick: () => editor.chain().focus().toggleStrike().run()
    },
    {
      type: 'color',
      icon: Palette,
      onClick: () => {
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#000000';
        colorInput.style.position = 'absolute';
        colorInput.style.left = '-9999px';

        document.body.appendChild(colorInput);

        colorInput.click();

        colorInput.addEventListener('input', () => {
          const color = colorInput.value;
          editor.chain().focus().setColor(color).run();
          document.body.removeChild(colorInput);
        });
      }
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
      onClick: () => editor.chain().focus().setCodeBlock().run()
    },
    {
      type: 'horizontalRule',
      icon: Minus,
      onClick: () => editor.chain().focus().setHorizontalRule().run()
    },
    {
      type: 'image',
      icon: Image,
      onClick: () => setIsImageDialogOpen(true)
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
        const input = prompt(
          '구글맵 퍼가기 코드(<iframe ...>)나 embed src 주소를 붙여넣으세요'
        );
        const src = input ? extractEmbedSrc(input) : null;
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
    <>
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
          </Button>
        ))}
      </div>
      <ImageLayoutDialog
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        onInsert={handleInsertImages}
      />
    </>
  );
}
