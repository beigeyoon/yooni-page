import AdminNav from '@/components/Admin/AdminNav';
import AdminPostsManager from '@/components/Admin/AdminPostsManager';

export default function AdminPage() {
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-6 py-8 max-sm:px-4">
      <AdminNav current="/admin" />
      <AdminPostsManager />
    </div>
  );
}
