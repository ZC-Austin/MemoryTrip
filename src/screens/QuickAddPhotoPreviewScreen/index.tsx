import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { usePhotoStore } from '../../stores';
import { uuid } from '../../utils/uuid';
import { imageService } from '../../services';
import type { QuickAddPhotoPreviewScreenProps } from '../../navigation/types';

const { width } = Dimensions.get('window');
const THUMB = (width - 32 - 8) / 3;

export function QuickAddPhotoPreviewScreen({ route, navigation }: QuickAddPhotoPreviewScreenProps) {
  const { tripId, photoUris, source, cameraGps, photoExifs } = route.params;
  const { colors, space, radius, fontSize } = useTheme();

  const [memo,   setMemo]   = useState('');
  const [saving, setSaving] = useState(false);

  const { addPhotos } = usePhotoStore();

  const handleSave = async () => {
    setSaving(true);
    try {
      const processed = await Promise.all(
        photoUris.map((uri, i) => {
          const photoId = uuid();
          return imageService.processPickedPhoto(uri, tripId, photoId, {
            source,
            exif:      photoExifs?.[i] ?? null,
            cameraGps: cameraGps ?? null,
          }).then(p => ({ photoId, ...p }));
        }),
      );

      await addPhotos(
        processed.map(p => ({
          trip_id:         tripId,
          place_id:        null,
          local_path:      p.localPath,
          thumb_path:      p.thumbPath,
          taken_at:        p.takenAt ?? new Date().toISOString(),
          gps_lat:         p.gpsLat,
          gps_lng:         p.gpsLng,
          location_source: p.locationSource,
          memo:            memo.trim() || null,
          sync_status:     'pending' as const,
        })),
      );

      navigation.goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('저장 실패', msg || '다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.lg }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>
          사진 {photoUris.length}장
        </Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: radius.xl }]}
          >
            {saving ? <ActivityIndicator size="small" color={colors.onPrimary} /> : (
              <Text style={[{ color: colors.onPrimary, fontWeight: '600', fontSize: fontSize.md }]}>저장</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[4] }}>
        {/* Thumbnail grid */}
        <View style={[styles.grid, { marginBottom: space[5] }]}>
          {photoUris.map((uri, i) => (
            <View
              key={i}
              style={[
                styles.thumb,
                { width: THUMB, height: THUMB, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, margin: 4 },
              ]}
            >
              <Image source={{ uri }} style={styles.thumbImg} />
            </View>
          ))}
        </View>

        {/* Source info */}
        <View style={[styles.infoRow, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[3], marginBottom: space[4] }]}>
          <Ionicons
            name={source === 'camera' ? 'camera-outline' : 'images-outline'}
            size={16}
            color={colors.textTertiary}
          />
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm, marginLeft: 6 }]}>
            {source === 'camera' ? 'GPS 위치 자동 첨부' : 'EXIF 위치 자동 읽기'}
          </Text>
        </View>

        {/* Shared memo */}
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>
          메모 (모든 사진에 적용)
        </Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="이 순간을 기록해보세요"
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[
            styles.memoInput,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, color: colors.textPrimary, fontSize: fontSize.lg, padding: space[4] },
          ]}
        />

        <Text style={[{ color: colors.textTertiary, fontSize: fontSize.sm, marginTop: space[3], textAlign: 'center' }]}>
          사진별 메모·태그 편집은 갤러리에서
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide:  { minWidth: 72 },
  headerTitle: { fontWeight: '600', flex: 1, textAlign: 'center' },
  saveBtn:     { paddingHorizontal: 16, paddingVertical: 8 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  thumb:       { overflow: 'hidden' },
  thumbImg:    { width: '100%', height: '100%' },
  infoRow:     { flexDirection: 'row', alignItems: 'center' },
  label:       { fontWeight: '500', marginBottom: 8 },
  memoInput:   { minHeight: 100, textAlignVertical: 'top' },
});
