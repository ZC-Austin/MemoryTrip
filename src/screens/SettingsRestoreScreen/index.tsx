import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { backupService } from '../../services';
import { formatDate } from '../../utils/date';
import type { BackupRecord } from '../../services/backup/index';
import type { SettingsRestoreScreenProps } from '../../navigation/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsRestoreScreen({ navigation }: SettingsRestoreScreenProps) {
  const { colors, space, radius, fontSize } = useTheme();

  const [backups,    setBackups]    = useState<BackupRecord[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [restoring,  setRestoring]  = useState<string | null>(null);

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

  const handleRestore = (record: BackupRecord) => {
    Alert.alert(
      '복구하시겠어요?',
      `${formatDate(record.createdAt.slice(0, 10))} 백업으로 교체돼요.\n현재 데이터는 사라지며 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복구',
          style: 'destructive',
          onPress: async () => {
            setRestoring(record.id);
            try {
              await backupService.restoreFromBackup(record);
              Alert.alert('복구 완료', '앱을 재시작해주세요.', [
                { text: '확인', onPress: () => navigation.popToTop() },
              ]);
            } catch (e) {
              const msg = e instanceof Error ? e.message : '알 수 없는 오류';
              Alert.alert('복구 실패', msg);
            } finally {
              setRestoring(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>백업에서 복구</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Warning card */}
      <View style={[
        styles.warnCard,
        { backgroundColor: `${colors.warning}22`, borderRadius: radius.xl, margin: space[4], marginBottom: 0, padding: space[4], borderColor: colors.warning, borderWidth: 1 },
      ]}>
        <View style={styles.warnRow}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <Text style={[{ color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600', marginLeft: 8 }]}>주의</Text>
        </View>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.md, marginTop: space[2], lineHeight: 22 }]}>
          복구를 실행하면 현재 앱의 모든 데이터가 선택한 백업 시점으로 교체돼요.
          이 작업은 되돌릴 수 없어요.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : backups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xl, marginTop: space[3], textAlign: 'center' }]}>
            복구 가능한 백업이 없어요
          </Text>
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.md, marginTop: space[2], textAlign: 'center' }]}>
            먼저 백업을 생성해주세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={backups}
          keyExtractor={item => item.fileName}
          contentContainerStyle={{ padding: space[4] }}
          renderItem={({ item }) => {
            const isRestoring = restoring === item.id;
            return (
              <TouchableOpacity
                onPress={() => handleRestore(item)}
                disabled={restoring !== null}
                style={[
                  styles.row,
                  { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4], marginBottom: space[3] },
                ]}
              >
                <Ionicons name="document-outline" size={24} color={colors.primary} style={{ marginRight: space[3] }} />
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '500' }]}>
                    {formatDate(item.createdAt.slice(0, 10))}
                  </Text>
                  <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm, marginTop: 2 }]}>
                    {formatBytes(item.sizeBytes)}
                  </Text>
                </View>
                {isRestoring ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[{ color: colors.primary, fontSize: fontSize.md, fontWeight: '600' }]}>복구</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  warnCard:    {},
  warnRow:     { flexDirection: 'row', alignItems: 'center' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  row:         { flexDirection: 'row', alignItems: 'center' },
});
