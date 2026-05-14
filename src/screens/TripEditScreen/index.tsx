import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useTripStore } from '../../stores';
import { formatDate } from '../../utils/date';
import type { TripEditScreenProps } from '../../navigation/types';
import type { Theme } from '../../theme';

type TripType = 'trip' | 'camping';

export function TripEditScreen({ route, navigation }: TripEditScreenProps) {
  const { tripId } = route.params;
  const { colors, space, radius, fontSize } = useTheme();

  const { currentTrip, loadCurrentTrip, updateCurrentTrip } = useTripStore();

  const [title,    setTitle]    = useState('');
  const [tripType, setTripType] = useState<TripType>('trip');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [city,     setCity]     = useState('');
  const [country,  setCountry]  = useState('');
  const [summary,  setSummary]  = useState('');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    loadCurrentTrip(tripId);
  }, [tripId]);

  useEffect(() => {
    if (currentTrip?.id === tripId) {
      setTitle(currentTrip.title);
      setTripType(currentTrip.trip_type as TripType);
      setStartDate(currentTrip.start_date);
      setEndDate(currentTrip.end_date ?? '');
      setCity(currentTrip.city ?? '');
      setCountry(currentTrip.country ?? '');
      setSummary(currentTrip.summary ?? '');
    }
  }, [currentTrip?.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('', '여행 제목을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await updateCurrentTrip({
        title:      title.trim(),
        trip_type:  tripType,
        start_date: startDate,
        end_date:   endDate.trim() || null,
        city:       city.trim() || null,
        country:    country.trim() || null,
        summary:    summary.trim() || null,
      });
      navigation.goBack();
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.lg }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>여행 편집</Text>
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

      <ScrollView contentContainerStyle={{ padding: space[5] }} keyboardShouldPersistTaps="handled">
        <Field label="여행 제목 *">
          <TextInput value={title} onChangeText={setTitle} style={inputStyle({ colors, radius, fontSize, space })} />
        </Field>

        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>여행 형태 *</Text>
        <View style={[styles.typeRow, { marginBottom: space[5] }]}>
          {([['trip', '✈️', '여행'], ['camping', '⛺', '캠핑']] as const).map(([v, icon, label], i) => {
            const active = tripType === v;
            return (
              <TouchableOpacity
                key={v}
                onPress={() => setTripType(v)}
                style={[styles.typeBtn, { flex: 1, marginLeft: i > 0 ? space[2] : 0, backgroundColor: active ? colors.primary : colors.surfaceMuted, borderRadius: radius.xl, borderColor: active ? colors.primary : colors.border, borderWidth: 1 }]}
              >
                <Text style={{ fontSize: fontSize['2xl'] }}>{icon}</Text>
                <Text style={[{ color: active ? colors.onPrimary : colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600', marginTop: 4 }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Field label="시작일">
          <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" style={inputStyle({ colors, radius, fontSize, space })} />
        </Field>
        <Field label="종료일 (선택)">
          <TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" style={inputStyle({ colors, radius, fontSize, space })} />
        </Field>
        <Field label="도시">
          <TextInput value={city} onChangeText={setCity} placeholder="예: 제주시" style={inputStyle({ colors, radius, fontSize, space })} />
        </Field>
        <Field label="국가">
          <TextInput value={country} onChangeText={setCountry} placeholder="예: 한국" style={inputStyle({ colors, radius, fontSize, space })} />
        </Field>
        <Field label="한 줄 요약">
          <TextInput value={summary} onChangeText={setSummary} placeholder="예: 비 와도 좋았던 제주" style={inputStyle({ colors, radius, fontSize, space })} />
        </Field>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors, space, fontSize } = useTheme();
  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '500', marginBottom: 8 }]}>{label}</Text>
      {children}
    </View>
  );
}

function inputStyle(t: Pick<Theme, 'colors' | 'radius' | 'fontSize' | 'space'>): object {
  return { backgroundColor: t.colors.surfaceMuted, borderRadius: t.radius.lg, color: t.colors.textPrimary, fontSize: t.fontSize.xl, padding: t.space[3] };
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide:  { minWidth: 72 },
  headerTitle: { fontWeight: '600', flex: 1, textAlign: 'center' },
  saveBtn:     { paddingHorizontal: 16, paddingVertical: 8 },
  label:       { fontWeight: '500', marginBottom: 8 },
  typeRow:     { flexDirection: 'row' },
  typeBtn:     { alignItems: 'center', paddingVertical: 16 },
});
