import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useTripStore } from '../../stores';
import { todayIso, formatDate } from '../../utils/date';
import type { TripCreateScreenProps } from '../../navigation/types';

type TripType = 'trip' | 'camping';

export function TripCreateScreen({ navigation }: TripCreateScreenProps) {
  const { colors, space, radius, fontSize } = useTheme();
  const [title,     setTitle]     = useState('');
  const [tripType,  setTripType]  = useState<TripType>('trip');
  const [startDate, setStartDate] = useState(todayIso());
  const [editing,   setEditing]   = useState(false);
  const [rawDate,   setRawDate]   = useState(todayIso());
  const [saving,    setSaving]    = useState(false);

  const { createTrip } = useTripStore();

  const commitDate = () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      setStartDate(rawDate);
    } else {
      setRawDate(startDate);
    }
    setEditing(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('', '여행 제목을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const trip = await createTrip({
        title:         title.trim(),
        trip_type:     tripType,
        start_date:    startDate,
        end_date:      null,
        country:       null,
        city:          null,
        gps_lat:       null,
        gps_lng:       null,
        purpose:       null,
        satisfaction:  null,
        summary:       null,
        companions:    [],
        hero_photo_id: null,
      });
      navigation.replace('MainTabs', {
        screen: 'TabTrips',
        params: { screen: 'TripDetail', params: { tripId: trip.id } },
      } as never);
    } catch {
      Alert.alert('오류', '여행을 만들 수 없어요. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.lg }]}>취소</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>새 여행</Text>
          <View style={styles.headerSide}>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={saving}
              style={[styles.startBtn, { backgroundColor: colors.primary, borderRadius: radius.xl }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <View style={styles.startBtnRow}>
                  <Ionicons name="airplane" size={14} color={colors.onPrimary} />
                  <Text style={[{ color: colors.onPrimary, fontSize: fontSize.md, marginLeft: 4, fontWeight: '600' }]}>
                    시작하기
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: space[5] }} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>여행 제목 *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="예: 제주 힐링 여행"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            returnKeyType="done"
            style={[
              styles.input,
              { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.xl, padding: space[4], marginBottom: space[5] },
            ]}
          />

          {/* Trip type */}
          <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>여행 형태 *</Text>
          <View style={[styles.typeRow, { marginBottom: space[5] }]}>
            {TYPE_OPTIONS.map((opt, i) => {
              const active = tripType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setTripType(opt.value)}
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

          {/* Start date */}
          <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>시작일 *</Text>
          {editing ? (
            <TextInput
              value={rawDate}
              onChangeText={setRawDate}
              onBlur={commitDate}
              onSubmitEditing={commitDate}
              autoFocus
              keyboardType="numbers-and-punctuation"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.xl, padding: space[4] },
              ]}
            />
          ) : (
            <TouchableOpacity
              onPress={() => { setRawDate(startDate); setEditing(true); }}
              style={[
                styles.datePicker,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4] },
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={[{ color: colors.textPrimary, fontSize: fontSize.xl, marginLeft: 8 }]}>
                {formatDate(startDate)}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.helper, { color: colors.textTertiary, fontSize: fontSize.sm, marginTop: space[5] }]}>
            종료일은 마무리할 때 입력해도 돼요
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TYPE_OPTIONS: { value: TripType; icon: string; label: string }[] = [
  { value: 'trip',    icon: '✈️',  label: '여행' },
  { value: 'camping', icon: '⛺', label: '캠핑' },
];

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  flex:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide:   { minWidth: 80, alignItems: 'flex-end' },
  headerTitle:  { fontWeight: '600', flex: 1, textAlign: 'center' },
  startBtn:     { paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  startBtnRow:  { flexDirection: 'row', alignItems: 'center' },
  label:        { fontWeight: '500', marginBottom: 8 },
  input:        {},
  typeRow:      { flexDirection: 'row' },
  typeBtn:      { alignItems: 'center', paddingVertical: 16 },
  datePicker:   { flexDirection: 'row', alignItems: 'center' },
  helper:       { textAlign: 'center' },
});
