import { books } from '@/data/books';
import BookDetailClient from './BookDetailClient';

export function generateStaticParams() {
  return books.map((book) => ({ id: book.id }));
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookDetailClient id={id} />;
}
