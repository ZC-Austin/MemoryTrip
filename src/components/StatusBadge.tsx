import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { daysUntil } from '../utils/date';
import type { TripStatus } from '../types';

interface Props {
  status: TripStatus;
  startDate?: string;
}

export function StatusBadge({ status, startDate }: Props) {
  const { colors, fontSize, radius } = useTheme();

  if (status === 'completed') return null;

  let label = '';
  let bg    = '';
  let fg    = '';

  if (status === 'planned') {
    const d = startDate ? daysUntil(startDate) : 0;
    label = `예정 D-${d}`;
    bg    = colors.info;
    fg    = colors.onInfo;
  } else if (status === 'in_progress') {
    label = '● 진행 중';
    bg    = colors.warning;
    fg    = colors.onWarning;
  } else if (status === 'no_end_date') {
    label = '📅 종료일?';
    bg    = colors.warning;
    fg    = colors.onWarning;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: radius.full }]}>
      <Text style={[styles.text, { color: fg, fontSize: fontSize.xs }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  text:  { fontWeight: '600' },
});
