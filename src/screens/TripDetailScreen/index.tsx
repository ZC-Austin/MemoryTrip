import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useTripStore, usePhotoStore, useExpenseStore, useDiaryStore } from '../../stores';
import { formatDateRange, formatDate, formatCurrency } from '../../utils/date';
import type { TripStackParamList } from '../../navigation/types';
import type { TripWithStatus, TripStats, Photo, ExpenseSummary, DiaryEntry } from '../../types';

type Route = RouteProp<TripStackParamList, 'TripDetail'>;
type Nav   = NativeStackNavigationProp<TripStackParamList>;

export function TripDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { tripId } = route.params;

  const { colors, space, radius, fontSize } = useTheme();
  const { currentTrip, loadCurrentTrip, loadCurrentTripStats, currentTripStats, updateCurrentTrip, removeTrip } = useTripStore();
  const { photos, loadPhotos } = usePhotoStore();
  const { summary, loadExpenses } = useExpenseStore();
  const { entries, loadEntries } = useDiaryStore();

  // 화면 포커스마다 재조회 (QuickAdd에서 돌아올 때도 갱신됨)
  useFocusEffect(useCallback(() => {
    loadCurrentTrip(tripId);
    loadPhotos(tripId);
    loadExpenses(tripId);
    loadEntries(tripId);
  }, [tripId]));

  useFocusEffect(useCallback(() => {
    if (currentTrip) loadCurrentTripStats();
  }, [currentTrip?.id]));

  const trip = currentTrip?.id === tripId ? currentTrip : null;

  if (!trip) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.lg }]}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInProgress = trip.status === 'in_progress' || trip.status === 'no_end_date';

  const openQuickAdd = (screen: string) =>
    navigation.navigate('QuickAddStack' as never, { screen, params: { tripId } } as never);

  const handleDelete = () => {
    Alert.alert('여행 삭제', `"${trip.title}" 여행을 삭제하면 복구할 수 없어요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await removeTrip(tripId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleWrapUp = () => navigation.navigate('TripWrapUp', { tripId });
  const handleEdit   = () => navigation.navigate('TripEdit',   { tripId });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: space[4], paddingVertical: space[3], borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]} numberOfLines={1}>
          {trip.title}
        </Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(trip.title, '', [
              { text: '편집',     onPress: handleEdit },
              { text: '도장 짓기', onPress: handleWrapUp },
              { text: '삭제',     style: 'destructive', onPress: handleDelete },
              { text: '취소',     style: 'cancel' },
            ])
          }
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isInProgress ? (
          <InProgressContent
            trip={trip}
            photos={photos}
            onQuickAdd={openQuickAdd}
            onGallery={() => navigation.navigate('PhotoGallery', { tripId })}
          />
        ) : (
          <CompletedContent
            trip={trip}
            photos={photos}
            stats={currentTripStats}
            summary={summary}
            entries={entries}
            onGallery={() => navigation.navigate('PhotoGallery', { tripId })}
            onWrapUp={handleWrapUp}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── In-progress mode ─────────────────────────────────────────────────────────

interface InProgressProps {
  trip:       TripWithStatus;
  photos:     Photo[];
  onQuickAdd: (screen: string) => void;
  onGallery:  () => void;
}

function InProgressContent({ trip, photos, onQuickAdd, onGallery }: InProgressProps) {
  const { colors, space, radius, fontSize } = useTheme();
  const latestPhoto = photos[photos.length - 1]; // 가장 최신 사진 (ASC 정렬이므로 마지막이 최신)

  return (
    <View>
      {/* Status + date */}
      <View style={[styles.statusRow, { paddingHorizontal: space[4], paddingTop: space[3] }]}>
        <View style={[styles.statusPill, { backgroundColor: colors.warning, borderRadius: radius.full }]}>
          <View style={[styles.dot, { backgroundColor: colors.onWarning }]} />
          <Text style={[{ color: colors.onWarning, fontSize: fontSize.sm, fontWeight: '600' }]}>진행 중</Text>
        </View>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm, marginLeft: space[2] }]}>
          {formatDateRange(trip.start_date, trip.end_date)}
        </Text>
      </View>

      {/* Hero */}
      <TouchableOpacity onPress={onGallery} activeOpacity={0.9}>
        <View
          style={[
            styles.hero,
            { margin: space[4], borderRadius: radius.xl, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
          ]}
        >
          {latestPhoto ? (
            <Image source={{ uri: latestPhoto.local_path }} style={styles.heroImg} />
          ) : (
            <View style={styles.heroEmpty}>
              <Text style={{ fontSize: 48 }}>🌄</Text>
              <Text style={[{ color: colors.textTertiary, fontSize: fontSize.lg, marginTop: space[2] }]}>
                첫 기록을 남겨보세요
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Quick add buttons */}
      <View style={[styles.quickRow, { paddingHorizontal: space[4], marginBottom: space[5] }]}>
        {QUICK_BTNS.map(btn => (
          <TouchableOpacity
            key={btn.key}
            onPress={() => onQuickAdd(btn.screen)}
            style={[
              styles.quickBtn,
              { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg },
            ]}
          >
            <Text style={{ fontSize: fontSize['2xl'] }}>{btn.icon}</Text>
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4 }]}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timeline */}
      <View style={[styles.section, { paddingHorizontal: space[4], marginBottom: space[6] }]}>
        <View style={[styles.sectionHeader, { marginBottom: space[3] }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>타임라인</Text>
          {photos.length > 0 && (
            <TouchableOpacity onPress={onGallery}>
              <Text style={[{ color: colors.primary, fontSize: fontSize.md }]}>전체 보기</Text>
            </TouchableOpacity>
          )}
        </View>
        {photos.length === 0 ? (
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.md }]}>
            아직 기록이 없어요
          </Text>
        ) : (
          [...photos].reverse().slice(0, 5).map(photo => (
            <TouchableOpacity
              key={photo.id}
              onPress={onGallery}
              style={[styles.timelineItem, { borderLeftColor: colors.primary, paddingLeft: space[3], marginBottom: space[3] }]}
            >
              <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xs, marginBottom: space[1] }]}>
                {photo.taken_at ? formatDate(photo.taken_at.slice(0, 10)) : '날짜 없음'}
              </Text>
              <View style={styles.timelineRow}>
                <Image
                  source={{ uri: photo.thumb_path ?? photo.local_path }}
                  style={[styles.timelineThumb, { borderRadius: radius.sm, backgroundColor: colors.surfaceMuted }]}
                />
                {photo.memo ? (
                  <Text style={[{ color: colors.textPrimary, fontSize: fontSize.md, flex: 1, marginLeft: space[3] }]} numberOfLines={2}>
                    {photo.memo}
                  </Text>
                ) : (
                  <Text style={[{ color: colors.textTertiary, fontSize: fontSize.md, flex: 1, marginLeft: space[3] }]}>사진</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

// ─── Completed mode ───────────────────────────────────────────────────────────

interface CompletedProps {
  trip:      TripWithStatus;
  photos:    Photo[];
  stats:     TripStats | null;
  summary:   ExpenseSummary | null;
  entries:   DiaryEntry[];
  onGallery: () => void;
  onWrapUp:  () => void;
}

function CompletedContent({ trip, photos, stats, summary, entries, onGallery, onWrapUp }: CompletedProps) {
  const { colors, space, radius, fontSize } = useTheme();
  const heroPhoto = photos.find(p => p.id === trip.hero_photo_id) ?? photos[0];
  const tripEntry = entries.find(e => e.entry_date === null);

  return (
    <View>
      {/* Hero photo */}
      <TouchableOpacity onPress={onGallery} activeOpacity={0.9}>
        <View style={[{ height: 220, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }]}>
          {heroPhoto ? (
            <Image source={{ uri: heroPhoto.local_path }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroEmpty, { height: 220 }]}>
              <Text style={{ fontSize: 48 }}>📷</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Satisfaction + summary */}
      <View style={[{ padding: space[4] }]}>
        <Text style={[styles.heroTitle, { color: colors.textPrimary, fontSize: fontSize['3xl'] }]}>{trip.title}</Text>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.md, marginTop: space[1] }]}>
          {formatDateRange(trip.start_date, trip.end_date)}
        </Text>

        {trip.satisfaction != null && (
          <View style={[styles.stars, { marginTop: space[2] }]}>
            {Array.from({ length: 5 }, (_, i) => (
              <Ionicons key={i} name={i < trip.satisfaction! ? 'star' : 'star-outline'} size={20} color={colors.accent} />
            ))}
          </View>
        )}

        {trip.summary && (
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.lg, marginTop: space[2], fontStyle: 'italic' }]}>
            "{trip.summary}"
          </Text>
        )}
      </View>

      {/* Stats card */}
      {stats && (
        <View style={[styles.statsCard, { margin: space[4], backgroundColor: colors.surfaceMuted, borderRadius: radius.xl, padding: space[4] }]}>
          {[
            { label: '총 비용',  value: formatCurrency(stats.total_expense) },
            { label: '방문 장소', value: `${stats.place_count}곳` },
            { label: '사진',     value: `${stats.photo_count}장` },
            { label: '기간',     value: `${stats.night_count}박 ${stats.day_count}일` },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm }]}>{s.label}</Text>
              <Text style={[{ color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600', marginTop: 2 }]}>{s.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Best moment / revisit */}
      {tripEntry && (tripEntry.best_moment || tripEntry.want_to_revisit) && (
        <View style={[{ paddingHorizontal: space[4], marginBottom: space[4] }]}>
          {tripEntry.best_moment && (
            <View style={[styles.memoryBlock, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4], marginBottom: space[3] }]}>
              <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm, marginBottom: 4 }]}>가장 기억에 남는 순간</Text>
              <Text style={[{ color: colors.textPrimary, fontSize: fontSize.md }]}>{tripEntry.best_moment}</Text>
            </View>
          )}
          {tripEntry.want_to_revisit && (
            <View style={[styles.memoryBlock, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4] }]}>
              <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm, marginBottom: 4 }]}>다시 가고 싶은 곳</Text>
              <Text style={[{ color: colors.textPrimary, fontSize: fontSize.md }]}>{tripEntry.want_to_revisit}</Text>
            </View>
          )}
        </View>
      )}

      {/* Photo grid preview */}
      {photos.length > 0 && (
        <View style={[{ paddingHorizontal: space[4], marginBottom: space[4] }]}>
          <View style={[styles.sectionHeader, { marginBottom: space[3] }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>
              사진 {photos.length}장
            </Text>
            <TouchableOpacity onPress={onGallery}>
              <Text style={[{ color: colors.primary, fontSize: fontSize.md }]}>전체 보기</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photoGrid}>
            {photos.slice(0, 6).map((photo, i) => (
              <TouchableOpacity
                key={photo.id}
                onPress={onGallery}
                style={[styles.photoThumb, { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm }]}
              >
                <Image source={{ uri: photo.local_path }} style={styles.photoThumbImg} />
                {i === 5 && photos.length > 6 && (
                  <View style={[styles.photoMore, { borderRadius: radius.sm }]}>
                    <Text style={[{ color: '#fff', fontWeight: '700', fontSize: fontSize.lg }]}>+{photos.length - 5}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Expense summary */}
      {summary && summary.total > 0 && (
        <View style={[{ paddingHorizontal: space[4], marginBottom: space[4] }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize.xl, marginBottom: space[3] }]}>비용</Text>
          <View style={[{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4] }]}>
            <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm }]}>총 지출</Text>
            <Text style={[{ color: colors.textPrimary, fontSize: fontSize['2xl'], fontWeight: '700', marginTop: 2 }]}>
              {formatCurrency(summary.total)}
            </Text>
            {summary.daily_avg > 0 && (
              <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm, marginTop: 4 }]}>
                1일 평균 {formatCurrency(Math.round(summary.daily_avg))}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Wrap-up button for no_end_date */}
      {!trip.end_date && (
        <TouchableOpacity
          onPress={onWrapUp}
          style={[
            styles.wrapUpBtn,
            { margin: space[4], borderRadius: radius.xl, borderColor: colors.primary, borderWidth: 1.5, padding: space[4] },
          ]}
        >
          <Text style={[{ color: colors.primary, fontSize: fontSize.lg, fontWeight: '600', textAlign: 'center' }]}>
            🎯 도장 짓기
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── constants ────────────────────────────────────────────────────────────────

const QUICK_BTNS = [
  { key: 'camera',  screen: 'QuickAddCamera',  icon: '📸', label: '카메라' },
  { key: 'gallery', screen: 'QuickAddGallery', icon: '🖼', label: '갤러리' },
  { key: 'place',   screen: 'QuickAddPlace',   icon: '📍', label: '장소' },
  { key: 'expense', screen: 'QuickAddExpense', icon: '💰', label: '비용' },
  { key: 'diary',   screen: 'QuickAddDiary',   icon: '📝', label: '일기' },
] as const;

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle:  { fontWeight: '600', flex: 1, marginHorizontal: 12 },
  statusRow:    { flexDirection: 'row', alignItems: 'center' },
  statusPill:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  dot:          { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  hero:         { height: 200 },
  heroImg:      { width: '100%', height: '100%' },
  heroEmpty:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroTitle:    { fontWeight: '700' },
  quickRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn:     { flex: 1, marginHorizontal: 3, alignItems: 'center', paddingVertical: 12 },
  section:      {},
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontWeight: '700' },
  timelineItem:  { borderLeftWidth: 2 },
  timelineRow:   { flexDirection: 'row', alignItems: 'center' },
  timelineThumb: { width: 56, height: 56 },
  stars:         { flexDirection: 'row' },
  statsCard:     { flexDirection: 'row', flexWrap: 'wrap' },
  statItem:      { width: '50%', marginBottom: 12 },
  memoryBlock:   {},
  photoGrid:     { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
  photoThumb:    { width: '33.33%', aspectRatio: 1, padding: 2, position: 'relative', overflow: 'hidden' },
  photoThumbImg: { width: '100%', height: '100%' },
  photoMore:     { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  wrapUpBtn:     {},
});
