import { Spinner } from './Spinner';

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80">
    <Spinner />
  </div>
);

export default LoadingOverlay;
