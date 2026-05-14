import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
  FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useTripStore, usePhotoStore, useDiaryStore } from '../../stores';
import { formatDateRange, formatCurrency, todayIso } from '../../utils/date';
import type { TripWrapUpScreenProps } from '../../navigation/types';

const { width } = Dimensions.get('window');
const PHOTO_THUMB = (width - 48) / 4;

export function TripWrapUpScreen({ route, navigation }: TripWrapUpScreenProps) {
  const { tripId } = route.params;
  const { colors, space, radius, fontSize } = useTheme();

  const { currentTrip, currentTripStats, loadCurrentTrip, loadCurrentTripStats, updateCurrentTrip } = useTripStore();
  const { photos, loadPhotos } = usePhotoStore();
  const { entries, loadEntries, saveEntry, getTripLevelEntry } = useDiaryStore();

  const [endDate,    setEndDate]    = useState(todayIso());
  const [rating,     setRating]     = useState(0);
  const [summary,    setSummary]    = useState('');
  const [bestMoment, setBestMoment] = useState('');
  const [revisit,    setRevisit]    = useState('');
  const [heroId,     setHeroId]     = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    loadCurrentTrip(tripId);
    loadPhotos(tripId);
    loadEntries(tripId);
  }, [tripId]);

  useEffect(() => {
    if (currentTrip?.id === tripId) {
      loadCurrentTripStats();
      if (currentTrip.end_date) setEndDate(currentTrip.end_date);
      if (currentTrip.satisfaction) setRating(currentTrip.satisfaction);
      if (currentTrip.summary) setSummary(currentTrip.summary);
      if (currentTrip.hero_photo_id) setHeroId(currentTrip.hero_photo_id);
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    const existing = getTripLevelEntry();
    if (existing) {
      if (existing.best_moment) setBestMoment(existing.best_moment);
      if (existing.want_to_revisit) setRevisit(existing.want_to_revisit);
    }
  }, [entries.length]);

  const trip = currentTrip?.id === tripId ? currentTrip : null;
  const stats = currentTripStats;

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateCurrentTrip({
        end_date:      endDate || null,
        satisfaction:  rating > 0 ? rating : null,
        summary:       summary.trim() || null,
        hero_photo_id: heroId ?? (photos[0]?.id ?? null),
      });
      if (bestMoment.trim() || revisit.trim()) {
        await saveEntry({
          trip_id:         tripId,
          entry_date:      null,
          emotions:        [],
          memo:            null,
          best_moment:     bestMoment.trim() || null,
          want_to_revisit: revisit.trim() || null,
        });
      }
      navigation.navigate('TripDetail', { tripId });
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  if (!trip) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.lg }]}>건너뛰기</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>도장 짓기</Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity
            onPress={handleComplete}
            disabled={saving}
            style={[styles.doneBtn, { backgroundColor: colors.primary, borderRadius: radius.xl }]}
          >
            {saving ? <ActivityIndicator size="small" color={colors.onPrimary} /> : (
              <Text style={[{ color: colors.onPrimary, fontWeight: '600', fontSize: fontSize.md }]}>완료</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[4] }} keyboardShouldPersistTaps="handled">
        {/* Stats card */}
        {stats && (
          <View style={[styles.statsCard, { backgroundColor: colors.primary, borderRadius: radius.xl, padding: space[5], marginBottom: space[5] }]}>
            <Text style={[{ color: colors.onPrimary, fontSize: fontSize['2xl'], fontWeight: '700', marginBottom: space[1] }]}>
              {trip.title}
            </Text>
            <Text style={[{ color: colors.onPrimary, fontSize: fontSize.md, marginBottom: space[4] }]}>
              {formatDateRange(trip.start_date, trip.end_date)}
            </Text>
            <View style={styles.statsRow}>
              {[
                { label: '방문 장소', value: `${stats.place_count}곳` },
                { label: '사진',     value: `${stats.photo_count}장` },
                { label: '기간',     value: `${stats.night_count}박 ${stats.day_count}일` },
                { label: '총 비용',  value: formatCurrency(stats.total_expense) },
              ].map(s => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={[{ color: 'rgba(255,255,255,0.7)', fontSize: fontSize.sm }]}>{s.label}</Text>
                  <Text style={[{ color: colors.onPrimary, fontSize: fontSize.lg, fontWeight: '600', marginTop: 2 }]}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* End date */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>종료일 확정</Text>
        <TextInput
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.input,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.xl, padding: space[4], marginBottom: space[5] },
          ]}
        />

        {/* Rating */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>이번 여행 어땠어요?</Text>
        <View style={[styles.starRow, { marginBottom: space[5] }]}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => setRating(n === rating ? 0 : n)} style={{ padding: 4 }}>
              <Ionicons
                name={n <= rating ? 'star' : 'star-outline'}
                size={40}
                color={colors.accent}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>한 줄로 표현하면</Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="비 와도 좋았던 제주"
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.xl, padding: space[4], marginBottom: space[5] },
          ]}
        />

        {/* Best moment */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>가장 기억에 남는 순간</Text>
        <TextInput
          value={bestMoment}
          onChangeText={setBestMoment}
          placeholder="떠오르는 장면을 적어보세요"
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[
            styles.input, styles.multilineInput,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[4], marginBottom: space[5] },
          ]}
        />

        {/* Revisit */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>다시 가고 싶은 곳</Text>
        <TextInput
          value={revisit}
          onChangeText={setRevisit}
          placeholder="장소나 느낌을 적어보세요"
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[
            styles.input, styles.multilineInput,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[4], marginBottom: space[5] },
          ]}
        />

        {/* Hero photo */}
        {photos.length > 0 && (
          <View>
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>대표 사진 선택</Text>
            <FlatList
              data={photos}
              horizontal
              keyExtractor={p => p.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = heroId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => setHeroId(selected ? null : item.id)}
                    style={[
                      styles.heroThumb,
                      {
                        width:       PHOTO_THUMB,
                        height:      PHOTO_THUMB,
                        borderRadius: 8,
                        borderWidth:  selected ? 3 : 0,
                        borderColor:  colors.primary,
                        marginRight:  8,
                        overflow:    'hidden',
                        backgroundColor: colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Image source={{ uri: item.thumb_path ?? item.local_path }} style={styles.heroThumbImg} />
                    {selected && (
                      <View style={[styles.heroCheck, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide:   { minWidth: 80 },
  headerTitle:  { fontWeight: '600', flex: 1, textAlign: 'center' },
  doneBtn:      { paddingHorizontal: 16, paddingVertical: 8 },
  statsCard:    {},
  statsRow:     { flexDirection: 'row', flexWrap: 'wrap' },
  statItem:     { width: '50%', marginBottom: 8 },
  label:        { fontWeight: '500', marginBottom: 8 },
  input:        {},
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  starRow:      { flexDirection: 'row' },
  heroThumb:    {},
  heroThumbImg: { width: '100%', height: '100%' },
  heroCheck:    { position: 'absolute', bottom: 4, right: 4, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
});
