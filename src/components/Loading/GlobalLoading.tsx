'use client';

import { useLoadingStore } from '@/stores/useLoadingStore';
import { Spinner } from './Spinner';

const GlobalLoading = () => {
  const showLoading = useLoadingStore(state => state.showLoading);

  if (!showLoading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
      <Spinner />
    </div>
  );
};

export default GlobalLoading;
