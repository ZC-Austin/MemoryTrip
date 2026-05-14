import type {
  NavigatorScreenParams,
  CompositeScreenProps,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ─── Param Lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs:     NavigatorScreenParams<MainTabParamList>;
  TripCreate:   undefined;
  QuickAddStack: NavigatorScreenParams<QuickAddStackParamList>;
};

export type MainTabParamList = {
  TabHome:     NavigatorScreenParams<HomeStackParamList>;
  TabTrips:    NavigatorScreenParams<TripStackParamList>;
  TabMap:      undefined;
  TabSettings: NavigatorScreenParams<SettingsStackParamList>;
};

export type HomeStackParamList = {
  Home:         undefined;
  TripDetail:   { tripId: string };
  PhotoGallery: { tripId: string; initialPhotoId?: string; sortBy?: 'date' | 'place' };
};

export type TripStackParamList = {
  TripList:     undefined;
  TripDetail:   { tripId: string };
  TripEdit:     { tripId: string };
  TripWrapUp:   { tripId: string };
  PhotoGallery: { tripId: string; initialPhotoId?: string; sortBy?: 'date' | 'place' };
};

export type QuickAddStackParamList = {
  QuickAddCamera:       { tripId: string };
  QuickAddGallery:      { tripId: string };
  QuickAddPhotoPreview: {
    tripId:     string;
    photoUris:  string[];
    source:     'camera' | 'gallery';
    cameraGps?: { lat: number; lng: number } | null;
    photoExifs?: Array<Record<string, unknown> | null | undefined>;
  };
  QuickAddPlace:        { tripId: string };
  QuickAddExpense:      { tripId: string };
  QuickAddDiary:        { tripId: string; date?: string };
};

export type SettingsStackParamList = {
  Settings:           undefined;
  SettingsBackup:     undefined;
  SettingsBackupList: undefined;
  SettingsRestore:    undefined;
};

// ─── Screen Props ─────────────────────────────────────────────────────────────

export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export type TripListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<TripStackParamList, 'TripList'>,
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

// TripDetail은 HomeStack / TripStack 양쪽에 존재.
// 각 스택에서 컴포넌트를 공유하므로 useRoute()로 파라미터에 접근.
export type TripDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<TripStackParamList, 'TripDetail'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type TripCreateScreenProps  = NativeStackScreenProps<RootStackParamList, 'TripCreate'>;
export type TripEditScreenProps    = NativeStackScreenProps<TripStackParamList, 'TripEdit'>;
export type TripWrapUpScreenProps  = NativeStackScreenProps<TripStackParamList, 'TripWrapUp'>;

export type PhotoGalleryScreenProps = CompositeScreenProps<
  NativeStackScreenProps<TripStackParamList, 'PhotoGallery'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type QuickAddCameraScreenProps       = NativeStackScreenProps<QuickAddStackParamList, 'QuickAddCamera'>;
export type QuickAddGalleryScreenProps      = NativeStackScreenProps<QuickAddStackParamList, 'QuickAddGallery'>;
export type QuickAddPhotoPreviewScreenProps = NativeStackScreenProps<QuickAddStackParamList, 'QuickAddPhotoPreview'>;
export type QuickAddPlaceScreenProps        = NativeStackScreenProps<QuickAddStackParamList, 'QuickAddPlace'>;
export type QuickAddExpenseScreenProps      = NativeStackScreenProps<QuickAddStackParamList, 'QuickAddExpense'>;
export type QuickAddDiaryScreenProps        = NativeStackScreenProps<QuickAddStackParamList, 'QuickAddDiary'>;

export type SettingsScreenProps          = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;
export type SettingsBackupScreenProps    = NativeStackScreenProps<SettingsStackParamList, 'SettingsBackup'>;
export type SettingsBackupListScreenProps = NativeStackScreenProps<SettingsStackParamList, 'SettingsBackupList'>;
export type SettingsRestoreScreenProps   = NativeStackScreenProps<SettingsStackParamList, 'SettingsRestore'>;

// ─── Global Type Registration ─────────────────────────────────────────────────
// useNavigation() 호출 시 RootStackParamList 기반으로 타입 추론됨

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
