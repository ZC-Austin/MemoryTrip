import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useTheme } from '../../theme';
import { useDiaryStore } from '../../stores';
import { todayIso } from '../../utils/date';
import { EMOTION_TAGS } from '../../types';
import type { QuickAddDiaryScreenProps } from '../../navigation/types';
import type { EmotionTag } from '../../types';

export function QuickAddDiaryScreen({ route, navigation }: QuickAddDiaryScreenProps) {
  const { tripId, date: paramDate } = route.params;
  const { colors, space, radius, fontSize } = useTheme();

  const [isOverall,  setIsOverall]  = useState(!paramDate);
  const [date,       setDate]       = useState(paramDate ?? todayIso());
  const [emotions,   setEmotions]   = useState<EmotionTag[]>([]);
  const [memo,       setMemo]       = useState('');
  const [bestMoment, setBestMoment] = useState('');
  const [revisit,    setRevisit]    = useState('');
  const [saving,     setSaving]     = useState(false);

  const { saveEntry, entries } = useDiaryStore();

  // Pre-fill if editing existing entry
  useEffect(() => {
    const existing = entries.find(e =>
      isOverall ? e.entry_date === null : e.entry_date === date,
    );
    if (existing) {
      setEmotions(existing.emotions ?? []);
      setMemo(existing.memo ?? '');
      if (existing.best_moment) setBestMoment(existing.best_moment);
      if (existing.want_to_revisit) setRevisit(existing.want_to_revisit);
    }
  }, []);

  const toggleEmotion = (tag: EmotionTag) => {
    setEmotions(prev =>
      prev.includes(tag) ? prev.filter(e => e !== tag) : [...prev, tag],
    );
  };

  const handleSave = async () => {
    if (!memo.trim() && emotions.length === 0) {
      Alert.alert('', '감정이나 메모를 입력해주세요.');
      return;
    }

    const existing = entries.find(e =>
      isOverall ? e.entry_date === null : e.entry_date === date,
    );

    if (existing) {
      Alert.alert('', '이미 기록이 있어요. 업데이트할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '업데이트', onPress: doSave },
      ]);
    } else {
      doSave();
    }
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await saveEntry({
        trip_id:         tripId,
        entry_date:      isOverall ? null : date,
        emotions,
        memo:            memo.trim() || null,
        best_moment:     isOverall ? (bestMoment.trim() || null) : null,
        want_to_revisit: isOverall ? (revisit.trim() || null) : null,
      });
      navigation.goBack();
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.lg }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>일기</Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: radius.xl }]}
          >
            {saving ? <ActivityIndicator size="small" color={colors.onPrimary} /> : (
              <Text style={[{ color: colors.onPrimary, fontWeight: '600', fontSize: fontSize.md }]}>저장</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[4] }} keyboardShouldPersistTaps="handled">
        {/* Overall toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[3], marginBottom: space[4] }]}>
          <Text style={[{ color: colors.textPrimary, fontSize: fontSize.md }]}>전체 회고로 기록</Text>
          <Switch
            value={isOverall}
            onValueChange={setIsOverall}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Date (only when not overall) */}
        {!isOverall && (
          <View style={{ marginBottom: space[4] }}>
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>날짜</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[3] },
              ]}
            />
          </View>
        )}

        {/* Emotion chips */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>감정 (복수 선택)</Text>
        <View style={[styles.emotionRow, { marginBottom: space[4] }]}>
          {EMOTION_TAGS.map(tag => {
            const active = emotions.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleEmotion(tag)}
                style={[
                  styles.emotionChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceMuted,
                    borderRadius:    radius.full,
                    borderColor:     active ? colors.primary : colors.border,
                    borderWidth:     1,
                    marginRight:     space[1],
                    marginBottom:    space[1],
                  },
                ]}
              >
                <Text style={[{ color: active ? colors.onPrimary : colors.textSecondary, fontSize: fontSize.md, fontWeight: active ? '600' : '400' }]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Memo */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>메모</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="오늘의 기록..."
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[
            styles.memoInput,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[4], marginBottom: space[4] },
          ]}
        />

        {/* Overall-only fields */}
        {isOverall && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>가장 기억에 남는 순간</Text>
            <TextInput
              value={bestMoment}
              onChangeText={setBestMoment}
              placeholder="한 줄로 표현해보세요"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[
                styles.memoInput,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[4], marginBottom: space[4] },
              ]}
            />

            <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>다시 가고 싶은 곳</Text>
            <TextInput
              value={revisit}
              onChangeText={setRevisit}
              placeholder="장소나 느낌을 적어보세요"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[
                styles.memoInput,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[4] },
              ]}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide:  { minWidth: 72 },
  headerTitle: { fontWeight: '600', flex: 1, textAlign: 'center' },
  saveBtn:     { paddingHorizontal: 16, paddingVertical: 8 },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:       { fontWeight: '500', marginBottom: 8 },
  input:       {},
  emotionRow:  { flexDirection: 'row', flexWrap: 'wrap' },
  emotionChip: { paddingHorizontal: 14, paddingVertical: 8 },
  memoInput:   { minHeight: 100, textAlignVertical: 'top' },
});
