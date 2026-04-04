import BookDetailClient from './BookDetailClient';

// Data is now in Supabase - use placeholder for static export
export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookDetailClient id={id} />;
}
