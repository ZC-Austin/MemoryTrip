import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useExpenseStore, usePlaceStore } from '../../stores';
import { todayIso, formatDate } from '../../utils/date';
import type { QuickAddExpenseScreenProps } from '../../navigation/types';
import type { ExpenseCategory } from '../../types';

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'lodging',   label: '숙박',   icon: '🏨' },
  { value: 'transport', label: '교통',   icon: '🚗' },
  { value: 'food',      label: '식비',   icon: '🍽' },
  { value: 'cafe',      label: '카페',   icon: '☕' },
  { value: 'shopping',  label: '쇼핑',   icon: '🛍' },
  { value: 'campsite',  label: '캠핑장', icon: '⛺' },
  { value: 'equipment', label: '장비',   icon: '🎒' },
  { value: 'etc',       label: '기타',   icon: '💳' },
];

export function QuickAddExpenseScreen({ route, navigation }: QuickAddExpenseScreenProps) {
  const { tripId } = route.params;
  const { colors, space, radius, fontSize } = useTheme();

  const [category,  setCategory]  = useState<ExpenseCategory>('food');
  const [amount,    setAmount]    = useState('');
  const [date,      setDate]      = useState(todayIso());
  const [memo,      setMemo]      = useState('');
  const [expanded,  setExpanded]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  const { addExpense } = useExpenseStore();

  const handleSave = async () => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert('', '금액을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await addExpense({
        trip_id:   tripId,
        place_id:  null,
        category,
        amount:    num,
        currency:  'KRW',
        spent_on:  date,
        memo:      memo.trim() || null,
      });
      navigation.goBack();
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  const formatAmount = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');
    return digits ? Number(digits).toLocaleString('ko-KR') : '';
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.lg }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>비용 추가</Text>
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

      <ScrollView contentContainerStyle={{ padding: space[4] }}>
        {/* Category grid */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>카테고리</Text>
        <View style={[styles.categoryGrid, { marginBottom: space[5] }]}>
          {CATEGORIES.map(cat => {
            const active = category === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setCategory(cat.value)}
                style={[
                  styles.categoryBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceMuted,
                    borderRadius:    radius.lg,
                    borderColor:     active ? colors.primary : 'transparent',
                    borderWidth:     1,
                  },
                ]}
              >
                <Text style={{ fontSize: fontSize['2xl'] }}>{cat.icon}</Text>
                <Text style={[{ color: active ? colors.onPrimary : colors.textSecondary, fontSize: fontSize.sm, marginTop: 4, fontWeight: active ? '600' : '400' }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount display */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>금액</Text>
        <View
          style={[
            styles.amountDisplay,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4], marginBottom: space[5] },
          ]}
        >
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xl }]}>₩</Text>
          <TextInput
            value={amount}
            onChangeText={raw => setAmount(formatAmount(raw))}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            style={[styles.amountInput, { color: colors.textPrimary, fontSize: fontSize['4xl'] }]}
          />
        </View>

        {/* Expandable details */}
        <TouchableOpacity
          onPress={() => setExpanded(v => !v)}
          style={[styles.expandRow, { paddingVertical: space[3] }]}
        >
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.md }]}>세부 정보 (선택)</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {expanded && (
          <View>
            {/* Date */}
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>날짜</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[3], marginBottom: space[4] },
              ]}
            />

            {/* Memo */}
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>메모</Text>
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="메모를 입력해주세요"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[
                styles.input,
                styles.memo,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[3] },
              ]}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide:    { minWidth: 72 },
  headerTitle:   { fontWeight: '600', flex: 1, textAlign: 'center' },
  saveBtn:       { paddingHorizontal: 16, paddingVertical: 8 },
  label:         { fontWeight: '500', marginBottom: 8 },
  categoryGrid:  { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  categoryBtn:   { width: '25%', alignItems: 'center', paddingVertical: 12, marginBottom: 8, paddingHorizontal: 4 },
  amountDisplay: { flexDirection: 'row', alignItems: 'center' },
  amountInput:   { flex: 1, fontWeight: '700', marginLeft: 4 },
  expandRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input:         {},
  memo:          { minHeight: 80, textAlignVertical: 'top' },
});
