'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Toolbar from './Toolbar';
import { Input } from '../ui/input';
import { forwardRef, useImperativeHandle } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { FormValues } from '@/app/editor/page';

interface Props {
  register: UseFormRegister<FormValues>;
}

const TiptapEditor = forwardRef((props: Props, ref) => {
  const { register } = props;

  useImperativeHandle(ref, () => ({
    getEditorContent: () => editor?.getHTML() || ''
  }));

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
    content: ''
  });

  if (!editor) return <></>;
  return (
    <div className="flex flex-col gap-2">
      <Input
        id="title"
        placeholder="타이틀을 입력하세요"
        className="py-6"
        style={{ fontSize: 22, lineHeight: 1 }}
        {...register('title', { required: '타이틀을 입력하세요.' })}
      />
      <Input
        id="subtitle"
        placeholder="설명을 입력하세요"
        className="mb-3"
        {...register('subtitle', { required: '설명을 입력하세요.' })}
      />
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose editor-container"
      />
    </div>
  );
});

TiptapEditor.displayName = 'TiptapEditor';
export default TiptapEditor;
