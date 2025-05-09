'use client';

import { useAuth } from '@/hooks/useAuth';
import {
  useQuery,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { getThoughts, createThought } from '@/lib/api/thoughts';
import { Thought } from '@/types';
import { CirclePlus, Pointer } from 'lucide-react';
import { useState } from 'react';
const queryClient = new QueryClient();

const RandomThought = () => {
  const { isAdmin } = useAuth();
  const [index, setIndex] = useState<number>(0);

  const { data: thoughts, isLoading } = useQuery({
    queryKey: ['thought'],
    queryFn: () => getThoughts() as Promise<{ data: { data: Thought[] } }>,
    select: (data: { data: { data: Thought[] } }) => data.data.data as Thought[]
  });

  const nextThought = async () => {
    if (!thoughts || thoughts.length === 0) return;

    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * thoughts.length);
    } while (thoughts.length > 1 && newIndex === index);

    setIndex(newIndex);
  };

  const createNewThought = async () => {
    const content = prompt('새로운 생각을 입력하세요');
    if (!content) return;

    const response = await createThought({
      content
    });

    if (response.success) {
      alert('생각이 등록되었습니다.');
    } else {
      console.error('❌ 새로운 생각 등록 실패:', response.error);
    }
  };

  if (isLoading) return <div className="h-[56px]" />;
  return (
    <div className="relative mt-4 flex h-[40px] justify-center">
      {isAdmin && (
        <button
          className="absolute m-[-24px] text-neutral-300 hover:text-neutral-500"
          onClick={createNewThought}>
          <CirclePlus size={18} />
        </button>
      )}
      <blockquote
        className="hover:animate-wobble mb-2 flex w-fit cursor-pointer gap-2 text-center text-2xl font-bold italic text-neutral-700 transition"
        onClick={nextThought}>
        <Pointer
          size={28}
          className="animate-blink text-neutral-300 hover:animate-none"
        />
        {`" ${thoughts && thoughts.length > 0 ? thoughts[index].content : 'Yooni said..'} "`}
      </blockquote>
    </div>
  );
};

const RandomThoughtWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RandomThought />
    </QueryClientProvider>
  );
};

export default RandomThoughtWrapper;
