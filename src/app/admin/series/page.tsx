import AdminNav from '@/components/Admin/AdminNav';
import AdminSeriesList from '@/components/Admin/AdminSeriesList';

export default function AdminSeriesPage() {
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-6 py-8 max-sm:px-4">
      <AdminNav current="/admin/series" />
      <AdminSeriesList />
    </div>
  );
}
