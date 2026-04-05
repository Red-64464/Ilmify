import MediaDetailClient from './MediaDetailClient';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MediaDetailClient params={params} />;
}
