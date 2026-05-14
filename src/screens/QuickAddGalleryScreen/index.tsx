import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import type { QuickAddGalleryScreenProps } from '../../navigation/types';

export function QuickAddGalleryScreen({ route, navigation }: QuickAddGalleryScreenProps) {
  const { tripId } = route.params;
  const { colors, fontSize } = useTheme();

  useEffect(() => {
    // 모달 진입 애니메이션이 끝난 뒤 갤러리 실행
    const timer = setTimeout(launch, 400);
    return () => clearTimeout(timer);
  }, []);

  const launch = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        navigation.goBack();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:              'images',
        allowsMultipleSelection: true,
        quality:                 0.85,
        exif:                    true,
        selectionLimit:          20,
      });

      if (result.canceled || result.assets.length === 0) {
        navigation.goBack();
        return;
      }

      const uris       = result.assets.map(a => a.uri);
      const photoExifs = result.assets.map(a => (a.exif as Record<string, unknown> | null | undefined) ?? null);

      // 피커가 닫힌 직후 네비게이션 — 한 프레임 뒤로 밀어 iOS 타이밍 문제 방지
      setTimeout(() => {
        navigation.replace('QuickAddPhotoPreview', {
          tripId,
          photoUris: uris,
          source:    'gallery',
          photoExifs,
        });
      }, 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('갤러리 오류', msg || '갤러리를 열 수 없어요. 다시 시도해주세요.');
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textTertiary, fontSize: fontSize.md, marginTop: 12 }]}>갤러리 불러오는 중...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
