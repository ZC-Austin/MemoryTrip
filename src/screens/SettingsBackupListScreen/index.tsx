import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { backupService } from '../../services';
import { formatDate } from '../../utils/date';
import type { BackupRecord } from '../../services/backup/index';
import type { SettingsBackupListScreenProps } from '../../navigation/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsBackupListScreen({ navigation }: SettingsBackupListScreenProps) {
  const { colors, space, radius, fontSize } = useTheme();

  const [backups,  setBackups]  = useState<BackupRecord[]>([]);
  const [loading,  setLoading]  = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      backupService.listLocalBackups()
        .then(list => { if (active) setBackups(list); })
        .catch(() => {})
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, []),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>백업 목록</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : backups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xl, marginTop: space[3], textAlign: 'center' }]}>
            저장된 백업이 없어요
          </Text>
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.md, marginTop: space[2], textAlign: 'center' }]}>
            백업 화면에서 지금 백업하기를 눌러보세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={backups}
          keyExtractor={item => item.fileName}
          contentContainerStyle={{ padding: space[4] }}
          renderItem={({ item }) => (
            <View style={[
              styles.row,
              { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4], marginBottom: space[3] },
            ]}>
              <Ionicons name="document-outline" size={24} color={colors.primary} style={{ marginRight: space[3] }} />
              <View style={{ flex: 1 }}>
                <Text style={[{ color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '500' }]}>
                  {formatDate(item.createdAt.slice(0, 10))}
                </Text>
                <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm, marginTop: 2 }]}>
                  {formatBytes(item.sizeBytes)} · {item.fileName}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  row:         { flexDirection: 'row', alignItems: 'center' },
});
