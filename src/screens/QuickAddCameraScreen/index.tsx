import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import { locationService } from '../../services';
import type { QuickAddCameraScreenProps } from '../../navigation/types';

export function QuickAddCameraScreen({ route, navigation }: QuickAddCameraScreenProps) {
  const { tripId } = route.params;
  const { colors, fontSize } = useTheme();

  useEffect(() => {
    // 모달 진입 애니메이션이 끝난 뒤 카메라 실행
    const timer = setTimeout(launch, 400);
    return () => clearTimeout(timer);
  }, []);

  const launch = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        navigation.goBack();
        return;
      }

      // GPS를 백그라운드로 시작 (5초 타임아웃), 카메라는 즉시 열림
      const gpsPromise: Promise<{ lat: number; lng: number } | null> = Promise.race([
        locationService.getCurrentLocation().then(g => g ? { lat: g.lat, lng: g.lng } : null),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
      ]);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality:    0.85,
        exif:       true,
      });

      if (result.canceled || result.assets.length === 0) {
        navigation.goBack();
        return;
      }

      const cameraGps  = await gpsPromise;
      const uris       = result.assets.map(a => a.uri);
      const photoExifs = result.assets.map(a => (a.exif as Record<string, unknown> | null | undefined) ?? null);

      // 피커가 닫힌 직후 네비게이션 — 한 프레임 뒤로 밀어 iOS 타이밍 문제 방지
      setTimeout(() => {
        navigation.replace('QuickAddPhotoPreview', {
          tripId,
          photoUris: uris,
          source:    'camera',
          cameraGps,
          photoExifs,
        });
      }, 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('카메라 오류', msg || '카메라를 열 수 없어요. 다시 시도해주세요.');
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textTertiary, fontSize: fontSize.md, marginTop: 12 }]}>카메라 준비 중...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
