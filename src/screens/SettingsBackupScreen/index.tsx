import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { backupService } from '../../services';
import { formatDate } from '../../utils/date';
import type { BackupRecord } from '../../services/backup/index';
import type { SettingsBackupScreenProps } from '../../navigation/types';

export function SettingsBackupScreen({ navigation }: SettingsBackupScreenProps) {
  const { colors, space, radius, fontSize } = useTheme();

  const [backing,     setBacking]     = useState(false);
  const [lastBackup,  setLastBackup]  = useState<BackupRecord | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    loadLastBackup();
  }, []);

  const loadLastBackup = async () => {
    try {
      const list = await backupService.listLocalBackups();
      setLastBackup(list[0] ?? null);
    } catch {
      // ignore
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleBackup = async () => {
    setBacking(true);
    try {
      const record = await backupService.createLocalBackup();
      await backupService.enqueueDbBackup(record);
      setLastBackup(record);
      Alert.alert('백업 완료', '데이터가 로컬에 저장되었어요.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      Alert.alert('백업 실패', msg);
    } finally {
      setBacking(false);
    }
  };

  const lastBackupLabel = loadingInfo
    ? '확인 중...'
    : lastBackup
      ? formatDate(lastBackup.createdAt.slice(0, 10))
      : '아직 백업한 기록이 없어요';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>백업 및 복구</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        {/* Status card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderRadius: radius.xl, padding: space[5], marginBottom: space[5] }]}>
          <View style={styles.cardRow}>
            <Ionicons name="cloud-done-outline" size={32} color={colors.primary} />
            <View style={{ marginLeft: space[4] }}>
              <Text style={[{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '600' }]}>
                마지막 백업
              </Text>
              <Text style={[{ color: colors.textTertiary, fontSize: fontSize.md, marginTop: 2 }]}>
                {lastBackupLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Backup now */}
        <TouchableOpacity
          onPress={handleBackup}
          disabled={backing}
          style={[
            styles.backupBtn,
            { backgroundColor: colors.primary, borderRadius: radius.xl, padding: space[4], marginBottom: space[4] },
          ]}
        >
          {backing ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.onPrimary} />
              <Text style={[{ color: colors.onPrimary, fontWeight: '600', fontSize: fontSize.xl, marginLeft: space[2] }]}>
                지금 백업하기
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Links */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SettingsBackupList')}
          style={[styles.linkRow, { borderBottomColor: colors.border }]}
        >
          <Text style={[{ color: colors.textPrimary, fontSize: fontSize.lg }]}>백업 목록 보기</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SettingsRestore')}
          style={[styles.linkRow, { borderBottomColor: colors.border }]}
        >
          <Text style={[{ color: colors.textPrimary, fontSize: fontSize.lg }]}>백업에서 복구</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Info */}
        <View style={[{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[4], marginTop: space[4] }]}>
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm, lineHeight: 20 }]}>
            백업 파일은 iCloud Drive (iOS) 또는 Google Drive (Android) 에 저장돼요.{'\n\n'}
            보관 정책: 일일 7일 · 주간 4주 · 월간 6개월
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  card:        {},
  cardRow:     { flexDirection: 'row', alignItems: 'center' },
  backupBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  linkRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
