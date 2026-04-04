import CourseDetailClient from './CourseDetailClient';

// For static export - seed courses are created dynamically in localStorage
export function generateStaticParams() {
  return [
    { id: 'course-tawhid' },
    { id: 'course-prayer' },
    { id: 'course-3-principles' },
  ];
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseDetailClient id={id} />;
}
