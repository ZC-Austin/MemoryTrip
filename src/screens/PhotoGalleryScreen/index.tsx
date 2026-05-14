import React, { useCallback, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Modal, Dimensions, Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { usePhotoStore } from '../../stores';
import { formatDate } from '../../utils/date';
import type { TripStackParamList } from '../../navigation/types';

type Route = RouteProp<TripStackParamList, 'PhotoGallery'>;
type Nav   = NativeStackNavigationProp<TripStackParamList>;

const { width } = Dimensions.get('window');
const COLS = 3;
const THUMB = (width - 4) / COLS;

export function PhotoGalleryScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { tripId, initialPhotoId, sortBy: initialSortBy } = route.params;

  const { colors, space, radius, fontSize } = useTheme();
  const { photos, loadPhotos, setSortBy, sortBy, removePhoto } = usePhotoStore();

  const [selectedId,     setSelectedId]     = useState<string | null>(initialPhotoId ?? null);
  const [multiSelect,    setMultiSelect]    = useState(false);
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());

  useFocusEffect(useCallback(() => {
    loadPhotos(tripId, initialSortBy ?? 'date');
  }, [tripId]));

  const openPhoto = (id: string) => { setSelectedId(id); };
  const closePhoto = () => setSelectedId(null);

  const handleLongPress = (id: string) => {
    setMultiSelect(true);
    setSelectedIds(new Set([id]));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    Alert.alert(`${selectedIds.size}장 삭제`, '선택한 사진을 삭제하면 복구할 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          for (const id of selectedIds) {
            await removePhoto(id);
          }
          setMultiSelect(false);
          setSelectedIds(new Set());
        },
      },
    ]);
  };

  const currentIndex    = selectedId ? photos.findIndex(p => p.id === selectedId) : -1;
  const currentPhoto    = currentIndex >= 0 ? photos[currentIndex] : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: space[4], paddingVertical: space[3] }]}>
        {multiSelect ? (
          <>
            <TouchableOpacity onPress={() => { setMultiSelect(false); setSelectedIds(new Set()); }}>
              <Text style={[{ color: colors.textSecondary, fontSize: fontSize.lg }]}>취소</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>
              {selectedIds.size}장 선택됨
            </Text>
            <TouchableOpacity onPress={() => setSelectedIds(new Set(photos.map(p => p.id)))}>
              <Text style={[{ color: colors.primary, fontSize: fontSize.md }]}>전체 선택</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.xl }]}>
              사진 {photos.length}장
            </Text>
            <TouchableOpacity
              onPress={() => setSortBy(sortBy === 'date' ? 'place' : 'date')}
            >
              <Text style={[{ color: colors.primary, fontSize: fontSize.md }]}>
                {sortBy === 'date' ? '날짜순' : '장소별'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Grid */}
      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📷</Text>
          <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xl, marginTop: space[3] }]}>
            아직 사진이 없어요
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={COLS}
          keyExtractor={p => p.id}
          renderItem={({ item }) => {
            const selected = selectedIds.has(item.id);
            return (
              <TouchableOpacity
                onPress={() => multiSelect ? toggleSelect(item.id) : openPhoto(item.id)}
                onLongPress={() => handleLongPress(item.id)}
                activeOpacity={0.85}
                style={[
                  styles.thumb,
                  {
                    width:            THUMB,
                    height:           THUMB,
                    opacity:          multiSelect && !selected ? 0.5 : 1,
                    borderColor:      selected ? colors.primary : 'transparent',
                    borderWidth:      selected ? 3 : 0,
                    backgroundColor:  colors.surfaceMuted,
                  },
                ]}
              >
                <Image source={{ uri: item.thumb_path ?? item.local_path }} style={styles.thumbImg} />
                {item.memo && (
                  <View style={[styles.memoDot, { backgroundColor: colors.primary }]} />
                )}
                {multiSelect && (
                  <View style={[styles.checkCircle, { borderColor: selected ? colors.primary : '#ccc', backgroundColor: selected ? colors.primary : 'transparent' }]}>
                    {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Multi-select action bar */}
      {multiSelect && selectedIds.size > 0 && (
        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={handleDeleteSelected} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
            <Text style={[{ color: colors.danger, fontSize: fontSize.sm, marginTop: 2 }]}>삭제</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Single photo modal */}
      <Modal visible={!!selectedId} animationType="fade" statusBarTranslucent>
        <View style={[styles.modalBg, { backgroundColor: '#000' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closePhoto} style={{ padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            {currentPhoto && (
              <Text style={[{ color: 'rgba(255,255,255,0.7)', fontSize: fontSize.md }]}>
                {currentIndex + 1} / {photos.length}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                if (currentPhoto) {
                  Alert.alert('', '', [
                    { text: '삭제', style: 'destructive', onPress: async () => { await removePhoto(currentPhoto.id); closePhoto(); } },
                    { text: '취소', style: 'cancel' },
                  ]);
                }
              }}
              style={{ padding: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {currentPhoto && (
            <Image
              source={{ uri: currentPhoto.local_path }}
              style={styles.modalImg}
              resizeMode="contain"
            />
          )}

          {currentPhoto?.memo && (
            <View style={[styles.memoPanel, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <Text style={[{ color: '#fff', fontSize: fontSize.md }]}>{currentPhoto.memo}</Text>
              {currentPhoto.taken_at && (
                <Text style={[{ color: 'rgba(255,255,255,0.6)', fontSize: fontSize.sm, marginTop: 4 }]}>
                  {formatDate(currentPhoto.taken_at.slice(0, 10))}
                </Text>
              )}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumb:      { overflow: 'hidden' },
  thumbImg:   { width: '100%', height: '100%' },
  memoDot:    { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3 },
  checkCircle: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  actionBar:  { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  actionBtn:  { flex: 1, alignItems: 'center', paddingVertical: 8 },
  modalBg:    { flex: 1, justifyContent: 'center' },
  modalHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 8, paddingBottom: 8 },
  modalImg:   { width: '100%', height: '100%' },
  memoPanel:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32 },
});
