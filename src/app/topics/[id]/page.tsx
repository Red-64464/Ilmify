import TopicDetailClient from './TopicDetailClient';

// For static export, we generate a placeholder
// Topics are created dynamically in localStorage
export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TopicDetailClient id={id} />;
}
