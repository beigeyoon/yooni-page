'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Toolbar from './Toolbar';

export default function TiptapEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Image.configure({
        inline: false
      })
    ],
    editable: true,
    content: `
      <h1>Hello Tiptap!</h1>
      <p>이 에디터는 툴바를 직접 추가한 예제입니다.</p>
    `
  });

  if (!editor) return <></>;
  return (
    <>
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose editor-container"
      />
    </>
  );
}
