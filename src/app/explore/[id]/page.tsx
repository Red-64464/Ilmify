import { themes } from '@/data/themes';
import ThemeDetailClient from './ThemeDetailClient';

export function generateStaticParams() {
  return themes.map((theme) => ({ id: theme.id }));
}

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ThemeDetailClient id={id} />;
}
