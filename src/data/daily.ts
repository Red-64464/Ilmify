import { DailyReminder } from '@/types';

export const dailyReminders: DailyReminder[] = [
  {
    id: 'daily-1',
    type: 'reminder',
    content: 'Chaque jour est une nouvelle opportunité de se rapprocher d\'Allah. Commence par la sincérité dans tes intentions.',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'daily-2',
    type: 'quote',
    content: '[Démo] La science est une lumière qu\'Allah place dans le cœur de qui Il veut.',
    source: 'Parole attribuée à l\'Imam Ash-Shafi\'i - à vérifier',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'daily-3',
    type: 'reminder',
    content: 'N\'oublie pas tes invocations du matin et du soir. Elles sont ta protection quotidienne.',
    date: new Date().toISOString().split('T')[0],
  },
];
