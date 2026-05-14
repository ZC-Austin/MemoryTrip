import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { usePlaceStore, useTripStore, useExpenseStore } from '../../stores';
import { todayIso } from '../../utils/date';
import type { QuickAddPlaceScreenProps } from '../../navigation/types';
import type { PlaceType } from '../../types';

type TripPlaceType = Extract<PlaceType, 'lodging' | 'restaurant' | 'campsite'>;

interface PlaceTypeOption { value: TripPlaceType; label: string; icon: string }

const TRIP_TYPES:    PlaceTypeOption[] = [{ value: 'lodging',   label: '숙소',   icon: '🏨' }, { value: 'restaurant', label: '식당', icon: '🍽' }];
const CAMPING_TYPES: PlaceTypeOption[] = [{ value: 'campsite',  label: '캠핑장', icon: '⛺' }, { value: 'restaurant', label: '식당', icon: '🍽' }];

export function QuickAddPlaceScreen({ route, navigation }: QuickAddPlaceScreenProps) {
  const { tripId } = route.params;
  const { colors, space, radius, fontSize } = useTheme();

  const { currentTrip } = useTripStore();
  const isCamping = currentTrip?.trip_type === 'camping';
  const typeOptions = isCamping ? CAMPING_TYPES : TRIP_TYPES;

  const [placeType,   setPlaceType]   = useState<TripPlaceType>(typeOptions[0].value);
  const [name,        setName]        = useState('');
  const [visitDate,   setVisitDate]   = useState(todayIso());
  const [rating,      setRating]      = useState(0);
  const [price,       setPrice]       = useState('');
  const [memo,        setMemo]        = useState('');
  const [evalExpanded, setEvalExpanded] = useState(false);
  const [memoExpanded, setMemoExpanded] = useState(false);
  const [saving,      setSaving]      = useState(false);

  const { addPlace } = usePlaceStore();
  const { addExpense } = useExpenseStore();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('', '장소 이름을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const place = await addPlace(
        {
          trip_id:    tripId,
          name:       name.trim(),
          gps_lat:    null,
          gps_lng:    null,
          visited_at: visitDate ? new Date(visitDate).toISOString() : null,
          rating:     rating > 0 ? rating : null,
          pros:       null,
          cons:       null,
          revisit:    null,
          memo:       memo.trim() || null,
        },
        { type: placeType },
      );

      const num = parseFloat(price.replace(/,/g, ''));
      if (price && !isNaN(num) && num > 0) {
        const catMap: Record<TripPlaceType, string> = {
          lodging:    'lodging',
          restaurant: 'food',
          campsite:   'campsite',
        };
        await addExpense({
          trip_id:   tripId,
          place_id:  place.id,
          category:  catMap[placeType] as never,
          amount:    num,
          currency:  'KRW',
          spent_on:  visitDate,
          memo:      null,
        });
      }

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>장소 추가</Text>
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
        {/* Type selector */}
        <View style={[styles.typeRow, { marginBottom: space[5] }]}>
          {typeOptions.map((opt, i) => {
            const active = placeType === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPlaceType(opt.value)}
                style={[
                  styles.typeBtn,
                  {
                    flex:            1,
                    marginLeft:      i > 0 ? space[2] : 0,
                    backgroundColor: active ? colors.primary : colors.surfaceMuted,
                    borderRadius:    radius.xl,
                    borderColor:     active ? colors.primary : colors.border,
                    borderWidth:     1,
                  },
                ]}
              >
                <Text style={{ fontSize: fontSize['2xl'] }}>{opt.icon}</Text>
                <Text style={[{ color: active ? colors.onPrimary : colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600', marginTop: 4 }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section: Basic info */}
        <SectionHeader title="기본 정보" expanded />

        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>이름 *</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={placeType === 'lodging' ? '숙소 이름' : placeType === 'campsite' ? '캠핑장 이름' : '식당 이름'}
          placeholderTextColor={colors.textTertiary}
          autoFocus
          style={[styles.input, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.xl, padding: space[4], marginBottom: space[4] }]}
        />

        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>방문일</Text>
        <TextInput
          value={visitDate}
          onChangeText={setVisitDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numbers-and-punctuation"
          style={[styles.input, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[3], marginBottom: space[5] }]}
        />

        {/* Section: Cost */}
        <SectionHeader title="비용" expanded />
        <TextInput
          value={price}
          onChangeText={raw => setPrice(raw.replace(/[^\d]/g, '') ? Number(raw.replace(/[^\d]/g, '')).toLocaleString('ko-KR') : '')}
          placeholder="금액 (입력 시 비용 자동 등록)"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.xl, padding: space[4], marginBottom: space[5] }]}
        />

        {/* Section: Evaluation (collapsed) */}
        <TouchableOpacity
          style={[styles.sectionToggle, { paddingVertical: space[3] }]}
          onPress={() => setEvalExpanded(v => !v)}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>평가 (선택)</Text>
          <Ionicons name={evalExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {evalExpanded && (
          <View style={{ marginBottom: space[3] }}>
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>평점</Text>
            <View style={[styles.starRow, { marginBottom: space[4] }]}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRating(n === rating ? 0 : n)}>
                  <Ionicons
                    name={n <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={colors.accent}
                    style={{ marginRight: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Section: Memo (collapsed) */}
        <TouchableOpacity
          style={[styles.sectionToggle, { paddingVertical: space[3] }]}
          onPress={() => setMemoExpanded(v => !v)}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>메모 (선택)</Text>
          <Ionicons name={memoExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {memoExpanded && (
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="자유롭게 기록해보세요"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[
              styles.input, styles.memoInput,
              { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[4] },
            ]}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, expanded }: { title: string; expanded?: boolean }) {
  const { colors, fontSize, space } = useTheme();
  return (
    <View style={[styles.sectionHeader, { paddingVertical: space[2], marginBottom: space[2] }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide:   { minWidth: 72 },
  headerTitle:  { fontWeight: '600', flex: 1, textAlign: 'center' },
  saveBtn:      { paddingHorizontal: 16, paddingVertical: 8 },
  typeRow:      { flexDirection: 'row' },
  typeBtn:      { alignItems: 'center', paddingVertical: 16 },
  label:        { fontWeight: '500', marginBottom: 8 },
  input:        {},
  memoInput:    { minHeight: 80, textAlignVertical: 'top' },
  sectionHeader: { borderBottomWidth: StyleSheet.hairlineWidth },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontWeight: '600' },
  starRow:      { flexDirection: 'row' },
});
