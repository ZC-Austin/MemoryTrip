import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { StatusBadge } from './StatusBadge';
import { formatDateRange, formatCurrency } from '../utils/date';
import type { TripWithStatus } from '../types';

interface Props {
  trip:    TripWithStatus;
  onPress: () => void;
}

const TYPE_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  trip:    'airplane-outline',
  camping: 'flame-outline',
};

export function TripCard({ trip, onPress }: Props) {
  const { colors, space, radius, fontSize } = useTheme();
  const isDashed = trip.status === 'no_end_date';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor:   colors.surface,
          borderRadius:      radius.lg,
          borderColor:       isDashed ? colors.warning : colors.border,
          borderWidth:       isDashed ? 1.5 : StyleSheet.hairlineWidth,
          borderStyle:       isDashed ? 'dashed' : 'solid',
          marginBottom:      space[3],
          padding:           space[3],
        },
      ]}
    >
      {/* Thumbnail */}
      <View
        style={[
          styles.thumb,
          { backgroundColor: colors.surfaceMuted, borderRadius: radius.md },
        ]}
      >
        <Ionicons
          name={TYPE_ICON[trip.trip_type] ?? 'airplane-outline'}
          size={28}
          color={colors.textTertiary}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Row 1: title + badge */}
        <View style={styles.row}>
          <Text
            style={[styles.title, { color: colors.textPrimary, fontSize: fontSize.lg }]}
            numberOfLines={1}
          >
            {trip.title}
          </Text>
          <StatusBadge status={trip.status} startDate={trip.start_date} />
        </View>

        {/* Row 2: dates + type */}
        <View style={[styles.row, { marginTop: 2 }]}>
          <Ionicons name={TYPE_ICON[trip.trip_type] ?? 'airplane-outline'} size={12} color={colors.textTertiary} />
          <Text style={[styles.meta, { color: colors.textSecondary, fontSize: fontSize.sm, marginLeft: 4 }]}>
            {formatDateRange(trip.start_date, trip.end_date)}
          </Text>
        </View>

        {/* Row 3: rating / photos / cost */}
        <View style={[styles.row, { marginTop: 4 }]}>
          {trip.satisfaction != null && (
            <View style={styles.chip}>
              <Ionicons name="star" size={10} color={colors.accent} />
              <Text style={[styles.chipText, { color: colors.textTertiary, fontSize: fontSize.xs }]}>
                {' '}{trip.satisfaction}
              </Text>
            </View>
          )}
          {trip.city && (
            <Text style={[styles.meta, { color: colors.textTertiary, fontSize: fontSize.xs, marginLeft: 6 }]}>
              {trip.city}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center' },
  thumb:    { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  content:  { flex: 1, marginLeft: 12 },
  row:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  title:    { fontWeight: '600', flex: 1, marginRight: 6 },
  meta:     { flexShrink: 1 },
  chip:     { flexDirection: 'row', alignItems: 'center' },
  chipText: {},
});
