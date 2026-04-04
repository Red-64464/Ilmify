import { flashcardDecks } from '@/data/flashcards';
import FlashcardStudyClient from './FlashcardStudyClient';

export function generateStaticParams() {
  return flashcardDecks.map((deck) => ({ id: deck.id }));
}

export default async function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FlashcardStudyClient id={id} />;
}
