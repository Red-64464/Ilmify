import FlashcardStudyClient from './FlashcardStudyClient';

// Data is now in Supabase - use placeholder for static export
export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default async function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FlashcardStudyClient id={id} />;
}
