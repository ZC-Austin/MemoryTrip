export type EmotionTag =
  | '행복'
  | '힐링'
  | '감동'
  | '설렘'
  | '피곤'
  | '외로움'
  | '아쉬움';

export const EMOTION_TAGS: EmotionTag[] = [
  '행복', '힐링', '감동', '설렘', '피곤', '외로움', '아쉬움',
];

export interface DiaryEntry {
  id: string;
  trip_id: string;
  entry_date: string | null; // 'YYYY-MM-DD' | NULL = trip-level 종합 기록
  emotions: EmotionTag[];    // JSON array → 앱에서 파싱
  memo: string | null;
  best_moment: string | null;
  want_to_revisit: string | null;
  created_at: string;
  updated_at: string;
}

export type NewDiaryEntry = Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>;
export type UpdateDiaryEntry = Partial<Omit<DiaryEntry, 'id' | 'trip_id' | 'created_at'>>;
