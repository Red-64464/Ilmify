import type { QuizQuestion, QuizSession } from '@/types';
import { supabase } from '@/lib/supabase/client';

function rowToQuestion(row: Record<string, unknown>): QuizQuestion {
  return {
    id: row.id as string,
    themeId: row.theme_id as string,
    type: row.type as QuizQuestion['type'],
    question: row.question as string,
    options: (row.options as string[]) || undefined,
    correctAnswer: row.correct_answer as string | number,
    explanation: row.explanation as string,
    source: (row.source as string) || undefined,
    difficulty: row.difficulty as QuizQuestion['difficulty'],
    masteryLevel: (row.mastery_level as number) || 0,
    lastReviewedAt: (row.last_reviewed_at as string) || undefined,
    errorCount: (row.error_count as number) || 0,
    tags: (row.tags as string[]) || [],
    proof: (row.proof as string) || undefined,
  };
}

function rowToSession(row: Record<string, unknown>): QuizSession {
  return {
    id: row.id as string,
    themeId: (row.theme_id as string) || undefined,
    questions: (row.questions as string[]) || [],
    answers: (row.answers as Record<string, string>) || {},
    score: (row.score as number) || 0,
    total: (row.total as number) || 0,
    completedAt: row.completed_at as string,
  };
}

export const quizRepository = {
  async getAllQuestions(userId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToQuestion);
  },

  async getQuestionsByTheme(userId: string, themeId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('user_id', userId)
      .eq('theme_id', themeId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToQuestion);
  },

  async createQuestion(userId: string, q: Omit<QuizQuestion, 'id' | 'masteryLevel' | 'errorCount'>): Promise<QuizQuestion> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        user_id: userId,
        theme_id: q.themeId,
        type: q.type,
        question: q.question,
        options: q.options || null,
        correct_answer: String(q.correctAnswer),
        explanation: q.explanation,
        source: q.source || null,
        difficulty: q.difficulty,
        mastery_level: 0,
        error_count: 0,
        tags: q.tags || [],
        proof: q.proof || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToQuestion(data);
  },

  async updateMastery(questionId: string, correct: boolean): Promise<void> {
    // Fetch current values
    const { data: current, error: fetchErr } = await supabase
      .from('quiz_questions')
      .select('mastery_level, error_count, review_count')
      .eq('id', questionId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const level = (current.mastery_level as number) || 0;
    const errors = (current.error_count as number) || 0;
    const reviews = (current.review_count as number) || 0;

    const newLevel = correct
      ? Math.min(100, level + (100 - level) * 0.3)
      : Math.max(0, level - 20);

    const { error } = await supabase
      .from('quiz_questions')
      .update({
        mastery_level: Math.round(newLevel),
        error_count: correct ? errors : errors + 1,
        review_count: reviews + 1,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', questionId);
    if (error) throw new Error(error.message);
  },

  async deleteQuestion(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);
    if (error) throw new Error(error.message);
  },

  async saveSession(userId: string, session: Omit<QuizSession, 'id' | 'completedAt'>): Promise<QuizSession> {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: userId,
        theme_id: session.themeId || null,
        questions: session.questions,
        answers: session.answers,
        score: session.score,
        total: session.total,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToSession(data);
  },

  async getSessions(userId: string, limit = 20): Promise<QuizSession[]> {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []).map(rowToSession);
  },

  async getErrorQuestions(userId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('user_id', userId)
      .gt('error_count', 0)
      .order('error_count', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToQuestion);
  },

  async importQuestions(userId: string, questions: Omit<QuizQuestion, 'id' | 'masteryLevel' | 'errorCount'>[]): Promise<number> {
    const rows = questions.map((q) => ({
      user_id: userId,
      theme_id: q.themeId,
      type: q.type,
      question: q.question,
      options: q.options || null,
      correct_answer: String(q.correctAnswer),
      explanation: q.explanation,
      source: q.source || null,
      difficulty: q.difficulty,
      mastery_level: 0,
      error_count: 0,
      tags: q.tags || [],
      proof: q.proof || null,
    }));
    const { error } = await supabase.from('quiz_questions').insert(rows);
    if (error) throw new Error(error.message);
    return rows.length;
  },
};
