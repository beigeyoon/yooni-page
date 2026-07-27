'use client';

import { useLoadingStore } from '@/stores/useLoadingStore';
import LoadingOverlay from './LoadingOverlay';

const GlobalLoading = () => {
  const showLoading = useLoadingStore(state => state.showLoading);

  if (!showLoading) return null;
  return <LoadingOverlay />;
};

export default GlobalLoading;
