import SurahDetailClient from './SurahDetailClient';

// For static export, generate placeholder. Actual surah number is resolved client-side via URL.
export function generateStaticParams() {
  return [{ surah: '_placeholder' }];
}

export default async function SurahPage({
  params,
}: {
  params: Promise<{ surah: string }>;
}) {
  const { surah } = await params;
  return <SurahDetailClient surah={surah} />;
}
