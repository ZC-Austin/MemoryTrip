import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Switch, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { SettingsScreenProps } from '../../navigation/types';

// ─── Row components ───────────────────────────────────────────────────────────

interface RowProps {
  icon?:    string;
  label:    string;
  value?:   string;
  onPress?: () => void;
  right?:   React.ReactNode;
  danger?:  boolean;
}

function SettingsRow({ icon, label, value, onPress, right, danger }: RowProps) {
  const { colors, space, fontSize } = useTheme();
  const content = (
    <View style={[styles.row, { paddingHorizontal: space[4], paddingVertical: space[3] }]}>
      {icon && (
        <Ionicons name={icon as never} size={20} color={danger ? colors.danger : colors.primary} style={{ marginRight: space[3] }} />
      )}
      <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.textPrimary, fontSize: fontSize.lg, flex: 1 }]}>
        {label}
      </Text>
      {value && (
        <Text style={[{ color: colors.textTertiary, fontSize: fontSize.md, marginRight: space[2] }]}>{value}</Text>
      )}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null)}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

interface SectionProps { title: string; children: React.ReactNode }

function Section({ title, children }: SectionProps) {
  const { colors, space, radius, fontSize } = useTheme();
  return (
    <View style={{ marginBottom: space[5] }}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontSize: fontSize.sm, paddingHorizontal: space[4], marginBottom: space[1] }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }]}>
        {children}
      </View>
    </View>
  );
}

function Divider() {
  const { colors, space } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: space[4] }]} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors, space, fontSize } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfaceMuted }]}>
      <View style={[styles.header, { paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: fontSize['3xl'] }]}>설정</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[4], paddingTop: 0 }}>

        {/* 1. 백업 및 복구 */}
        <Section title="백업 및 복구">
          <SettingsRow
            icon="cloud-upload-outline"
            label="자동 백업"
            right={<Switch trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" value />}
          />
          <Divider />
          <SettingsRow
            icon="folder-open-outline"
            label="백업 위치"
            value={Platform.OS === 'ios' ? 'iCloud Drive' : 'Google Drive'}
          />
          <Divider />
          <SettingsRow
            icon="time-outline"
            label="마지막 백업"
            value="—"
          />
          <Divider />
          <SettingsRow
            icon="cloud-download-outline"
            label="지금 백업하기"
            onPress={() => navigation.navigate('SettingsBackup')}
          />
          <Divider />
          <SettingsRow
            icon="list-outline"
            label="백업 목록"
            onPress={() => navigation.navigate('SettingsBackupList')}
          />
          <Divider />
          <SettingsRow
            icon="refresh-circle-outline"
            label="백업에서 복구"
            onPress={() => navigation.navigate('SettingsRestore')}
          />
          <Divider />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="DB 무결성 검사"
            value="정상 ✓"
          />
        </Section>

        {/* 2. 저장소 */}
        <Section title="저장소">
          <SettingsRow icon="phone-portrait-outline" label="사용 중" value="계산 중..." />
          <Divider />
          <SettingsRow icon="images-outline"  label="사진"       value="—" />
          <Divider />
          <SettingsRow icon="server-outline"  label="데이터베이스" value="—" />
          <Divider />
          <SettingsRow icon="archive-outline" label="백업"       value="—" />
        </Section>

        {/* 3. 권한 */}
        <Section title="권한">
          <SettingsRow
            icon="location-outline"
            label="위치"
            value="설정에서 확인"
            onPress={() => Linking.openSettings()}
          />
          <Divider />
          <SettingsRow
            icon="camera-outline"
            label="카메라"
            value="설정에서 확인"
            onPress={() => Linking.openSettings()}
          />
          <Divider />
          <SettingsRow
            icon="images-outline"
            label="사진"
            value="설정에서 확인"
            onPress={() => Linking.openSettings()}
          />
        </Section>

        {/* 4. 앱 */}
        <Section title="앱">
          <SettingsRow icon="color-palette-outline" label="테마" value="시스템" />
          <Divider />
          <SettingsRow icon="home-outline" label="시작 화면" value="홈" />
        </Section>

        {/* 5. 정보 */}
        <Section title="정보">
          <SettingsRow icon="information-circle-outline" label="버전" value="1.0.0" />
          <Divider />
          <SettingsRow
            icon="mail-outline"
            label="피드백 보내기"
            onPress={() => Linking.openURL('mailto:zest1116@gmail.com?subject=MemoryTrip 피드백')}
          />
          <Divider />
          <SettingsRow icon="document-text-outline" label="이용약관" />
          <Divider />
          <SettingsRow icon="lock-closed-outline" label="개인정보처리방침" />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  header:       {},
  title:        { fontWeight: '700' },
  sectionTitle: { fontWeight: '500' },
  sectionCard:  { shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1 },
  row:          { flexDirection: 'row', alignItems: 'center' },
  rowLabel:     {},
  divider:      { height: StyleSheet.hairlineWidth },
});
