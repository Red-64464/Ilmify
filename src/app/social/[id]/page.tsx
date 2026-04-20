import SocialPostClient from './SocialPostClient';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default async function SocialPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SocialPostClient postId={id} />;
}
