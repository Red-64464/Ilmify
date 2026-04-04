import CourseDetailClient from './CourseDetailClient';

// Data is now in Supabase - use placeholder for static export
export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseDetailClient id={id} />;
}
