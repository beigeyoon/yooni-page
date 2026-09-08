import AdminNav from '@/components/Admin/AdminNav';
import AdminSeriesDetail from '@/components/Admin/AdminSeriesDetail';

export default async function AdminSeriesDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-6 py-8 max-sm:px-4">
      <AdminNav current="/admin/series" />
      <AdminSeriesDetail seriesId={id} />
    </div>
  );
}
