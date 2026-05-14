import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useTripStore } from '../../stores';
import { TripCard } from '../../components/TripCard';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateRange } from '../../utils/date';
import type { HomeScreenProps } from '../../navigation/types';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors, space, radius, fontSize } = useTheme();
  const { trips, overallStats, loadTrips, loadOverallStats } = useTripStore();

  useEffect(() => {
    loadTrips();
    loadOverallStats();
  }, []);

  const activeTrip  = trips.find(t => t.status === 'in_progress');
  const plannedTrip = trips.find(t => t.status === 'planned');
  const recentTrips = trips
    .filter(t => t.id !== activeTrip?.id && t.id !== plannedTrip?.id)
    .slice(0, 5);

  const goToDetail = (tripId: string) =>
    navigation.navigate('TripDetail', { tripId });
  const goToCreate = () =>
    navigation.navigate('TripCreate');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingHorizontal: space[4], paddingVertical: space[3], borderBottomColor: colors.border, borderBottomWidth: 0.5 }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>
          Memory Trip
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={{ marginRight: space[3] }}>
            <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space[4], paddingBottom: space[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active trip card ── */}
        {activeTrip && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => goToDetail(activeTrip.id)}
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.primary,
                borderRadius:    radius['2xl'],
                marginBottom:    space[4],
                padding:         space[5],
              },
            ]}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroBadge}>
                <View style={[styles.pulseDot, { backgroundColor: colors.onPrimary }]} />
                <Text style={[styles.heroStatus, { color: colors.onPrimary, fontSize: fontSize.sm }]}>
                  진행 중
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onPrimary} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.onPrimary, fontSize: fontSize['3xl'] }]}>
              {activeTrip.title}
            </Text>
            <Text style={[styles.heroMeta, { color: colors.onPrimary, fontSize: fontSize.md }]}>
              {formatDateRange(activeTrip.start_date, activeTrip.end_date)}
            </Text>

            {/* Quick add buttons */}
            <View style={[styles.quickRow, { marginTop: space[4] }]}>
              {QUICK_BTNS.map(btn => (
                <TouchableOpacity
                  key={btn.key}
                  onPress={() => navigation.navigate('QuickAddStack', { screen: btn.screen, params: { tripId: activeTrip.id } } as never)}
                  style={[styles.quickBtn, { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: radius.xl }]}
                >
                  <Text style={[styles.quickIcon, { fontSize: fontSize['2xl'] }]}>{btn.icon}</Text>
                  <Text style={[styles.quickLabel, { color: colors.onPrimary, fontSize: fontSize.xs }]}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* ── Planned trip card ── */}
        {plannedTrip && !activeTrip && (
          <View
            style={[
              styles.plannedCard,
              { backgroundColor: colors.surfaceMuted, borderRadius: radius['2xl'], marginBottom: space[4], padding: space[4] },
            ]}
          >
            <StatusBadge status="planned" startDate={plannedTrip.start_date} />
            <Text style={[styles.plannedTitle, { color: colors.textPrimary, fontSize: fontSize.xl, marginTop: space[1] }]}>
              {plannedTrip.title}
            </Text>
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.md }]}>
              {formatDateRange(plannedTrip.start_date, plannedTrip.end_date)}
            </Text>
          </View>
        )}

        {/* ── Main CTA ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={goToCreate}
          style={[
            styles.ctaBtn,
            { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: space[6], marginBottom: space[3] },
          ]}
        >
          <Ionicons name="airplane" size={32} color={colors.onPrimary} />
          <Text style={[styles.ctaTitle, { color: colors.onPrimary, fontSize: fontSize['2xl'], marginTop: space[2] }]}>출발</Text>
          <Text style={[{ color: colors.onPrimary, fontSize: fontSize.sm, marginTop: space[1] }]}>새 여행 시작하기</Text>
        </TouchableOpacity>

        {/* ── 사진으로 여행 만들기 ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.photoBtn,
            { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space[4], marginBottom: space[6],
              borderWidth: 0.5, borderColor: colors.border },
          ]}
        >
          <Text style={{ fontSize: 18 }}>🖼</Text>
          <Text style={[styles.photoBtnText, { color: colors.textPrimary, fontSize: fontSize.md, marginLeft: space[3] }]}>
            사진으로 여행 만들기
          </Text>
        </TouchableOpacity>

        {/* ── Overall stats ── */}
        {overallStats && (
          <View
            style={[
              styles.statsRow,
              { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4], marginBottom: space[6] },
            ]}
          >
            {[
              { label: '여행', value: overallStats.tripCount },
              { label: '장소', value: overallStats.placeCount },
              { label: '사진', value: overallStats.photoCount },
            ].map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary, fontSize: fontSize['2xl'] }]}>
                  {s.value.toLocaleString()}
                </Text>
                <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Recent trips ── */}
        {recentTrips.length > 0 && (
          <View>
            <View style={[styles.sectionHeader, { marginBottom: space[3] }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>
                최근 여행
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('TabTrips' as never)}>
                <Text style={[{ color: colors.primary, fontSize: fontSize.md }]}>전체 보기</Text>
              </TouchableOpacity>
            </View>
            {recentTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} onPress={() => goToDetail(trip.id)} />
            ))}
          </View>
        )}

        {/* ── Empty state ── */}
        {trips.length === 0 && (
          <View style={[styles.empty, { marginTop: space[8] }]}>
            <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xl, textAlign: 'center' }]}>
              첫 여행을 시작해보세요
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const QUICK_BTNS = [
  { key: 'camera',  screen: 'QuickAddCamera',  icon: '📸', label: '카메라' },
  { key: 'gallery', screen: 'QuickAddGallery', icon: '🖼', label: '갤러리' },
  { key: 'place',   screen: 'QuickAddPlace',   icon: '📍', label: '장소' },
  { key: 'expense', screen: 'QuickAddExpense', icon: '💰', label: '비용' },
  { key: 'diary',   screen: 'QuickAddDiary',   icon: '📝', label: '일기' },
] as const;

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  heroCard:      {},
  heroRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heroBadge:     { flexDirection: 'row', alignItems: 'center' },
  pulseDot:      { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  heroStatus:    { fontWeight: '600' },
  heroTitle:     { fontWeight: '700', marginBottom: 4 },
  heroMeta:      {},
  quickRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn:      { flex: 1, marginHorizontal: 2, alignItems: 'center', paddingVertical: 10 },
  quickIcon:     {},
  quickLabel:    { marginTop: 4, fontWeight: '500' },
  plannedCard:   {},
  plannedTitle:  { fontWeight: '600' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:   { fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  ctaBtn:        { alignItems: 'center' },
  ctaTitle:      { fontWeight: '700' },
  photoBtn:      { flexDirection: 'row', alignItems: 'center' },
  photoBtnText:  { fontWeight: '500' },
  statsRow:      { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:      { alignItems: 'center' },
  statValue:     { fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontWeight: '700' },
  empty:         { alignItems: 'center' },
});
