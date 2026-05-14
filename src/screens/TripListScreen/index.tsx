import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useTripStore } from '../../stores';
import { TripCard } from '../../components/TripCard';
import type { TripListScreenProps } from '../../navigation/types';
import type { FilterType, FilterStatus, SortOrder } from '../../stores';
import type { TripStatus } from '../../types';

const TYPE_CHIPS: { value: FilterType; label: string }[] = [
  { value: 'all',     label: '전체' },
  { value: 'trip',    label: '여행' },
  { value: 'camping', label: '캠핑' },
];

const STATUS_CHIPS: { value: FilterStatus; label: string }[] = [
  { value: 'all',          label: '전체' },
  { value: 'in_progress',  label: '진행 중' },
  { value: 'planned',      label: '예정' },
  { value: 'no_end_date',  label: '종료일 미정' },
  { value: 'completed',    label: '완료' },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'updated_at',  label: '최근 수정순' },
  { value: 'start_date',  label: '시작일순' },
  { value: 'satisfaction', label: '평점순' },
];

export function TripListScreen({ navigation }: TripListScreenProps) {
  const { colors, space, radius, fontSize } = useTheme();
  const {
    trips,
    filteredTrips,
    filterType, filterStatus, sortOrder,
    searchQuery,
    loadTrips,
    setFilterType, setFilterStatus, setSortOrder, setSearchQuery, resetFilters,
    isLoading,
  } = useTripStore();

  const [showSearch, setShowSearch]   = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => { loadTrips(); }, []);

  const goToDetail = (tripId: string) => navigation.navigate('TripDetail', { tripId });

  const years = Array.from(new Set(trips.map(t => new Date(t.start_date).getFullYear()))).sort((a, b) => b - a);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        {showSearch ? (
          <View style={styles.searchRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="여행 검색..."
              placeholderTextColor={colors.textTertiary}
              autoFocus
              style={[
                styles.searchInput,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.xl, color: colors.textPrimary, fontSize: fontSize.lg, paddingHorizontal: space[3], paddingVertical: 8 },
              ]}
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }} style={{ marginLeft: space[2] }}>
              <Text style={[{ color: colors.primary, fontSize: fontSize.lg }]}>취소</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize['2xl'] }]}>여행 목록</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setShowSearch(true)} style={{ marginRight: space[3] }}>
                <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowSortMenu(v => !v)}>
                <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Sort menu */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, margin: space[3] }]}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { setSortOrder(opt.value); setShowSortMenu(false); }}
              style={[styles.sortItem, { borderBottomColor: colors.border, padding: space[3] }]}
            >
              <Text style={[{ color: sortOrder === opt.value ? colors.primary : colors.textPrimary, fontSize: fontSize.lg }]}>
                {opt.label}
              </Text>
              {sortOrder === opt.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: space[4], paddingVertical: space[2] }}>
        {TYPE_CHIPS.map(chip => (
          <Chip
            key={chip.value}
            label={chip.label}
            active={filterType === chip.value}
            onPress={() => setFilterType(chip.value)}
          />
        ))}
        <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: space[2] }} />
        {STATUS_CHIPS.slice(1).map(chip => (
          <Chip
            key={chip.value}
            label={chip.label}
            active={filterStatus === chip.value}
            onPress={() => setFilterStatus(filterStatus === chip.value ? 'all' : chip.value)}
          />
        ))}
      </ScrollView>

      {/* Count row */}
      <View style={[styles.countRow, { paddingHorizontal: space[4], paddingBottom: space[2] }]}>
        <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm }]}>
          {filteredTrips.length}건
        </Text>
        {(filterType !== 'all' || filterStatus !== 'all') && (
          <TouchableOpacity onPress={resetFilters}>
            <Text style={[{ color: colors.primary, fontSize: fontSize.sm }]}>초기화</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Trip list */}
      {filteredTrips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xl }]}>
            {isLoading ? '불러오는 중...' : searchQuery ? '검색 결과가 없어요' : '여행이 없어요'}
          </Text>
          {!searchQuery && !isLoading && (
            <TouchableOpacity
              onPress={() => navigation.navigate('TripCreate' as never)}
              style={[styles.emptyBtn, { backgroundColor: colors.primary, borderRadius: radius.xl, marginTop: 16 }]}
            >
              <Text style={[{ color: colors.onPrimary, fontSize: fontSize.lg, fontWeight: '600', padding: 12 }]}>
                첫 여행 시작하기
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={t => t.id}
          contentContainerStyle={{ padding: space[4] }}
          renderItem={({ item }) => (
            <TripCard trip={item} onPress={() => goToDetail(item.id)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps { label: string; active: boolean; onPress: () => void }

function Chip({ label, active, onPress }: ChipProps) {
  const { colors, radius, fontSize, space } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surfaceMuted,
          borderRadius:    radius.full,
          paddingHorizontal: space[3],
          paddingVertical:   6,
          marginRight:       space[1],
        },
      ]}
    >
      <Text style={[{ color: active ? colors.onPrimary : colors.textSecondary, fontSize: fontSize.sm, fontWeight: active ? '600' : '400' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  searchRow:   { flex: 1, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1 },
  sortMenu:    { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sortItem:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  countRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip:        {},
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBtn:    {},
});
