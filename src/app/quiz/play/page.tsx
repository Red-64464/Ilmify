import { Suspense } from 'react';
import QuizPlayClient from './QuizPlayClient';

export default function QuizPlayPage() {
  return (
    <Suspense>
      <QuizPlayClient />
    </Suspense>
  );
}
