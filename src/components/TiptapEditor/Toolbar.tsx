import { Editor } from '@tiptap/react';
import { Button } from '../ui/button';
import {
  LucideIcon,
  Heading1,
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
import { useRef } from 'react';
import uploadImage from '@/utils/uploadImage';
import heic2any from 'heic2any';

export default function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMultipleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    const uploadedUrls: string[] = [];

    for (const file of files) {
      let blob: Blob | File = file;
      if (
        file.type === 'image/heic' ||
        file.name.toLowerCase().endsWith('.heic')
      ) {
        try {
          const convertedBlob = (await heic2any({
            blob: file,
            toType: 'image/jpeg'
          })) as Blob;
          blob = new File(
            [convertedBlob],
            file.name.replace(/\.heic$/i, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
          );
        } catch (error) {
          console.error('❌ HEIC 변환 실패:', error);
          continue;
        }
      }

      const url = await uploadImage(blob as File);
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
