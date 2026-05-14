import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator }  from './MainTabNavigator';
import { QuickAddNavigator } from './QuickAddNavigator';
import { TripCreateScreen }  from '../screens/TripCreateScreen';
import { useNavigationTheme } from './useNavigationTheme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const navTheme = useNavigationTheme();

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 메인 탭 */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />

        {/* 모달 그룹 — 어느 탭에서든 표시 가능 */}
        <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
          {/* 여행 생성 — 바텀 시트 패턴 (TripCreateScreen 내부에서 바텀 시트 구현) */}
          <Stack.Screen name="TripCreate" component={TripCreateScreen} />

          {/* 빠른 추가 5종 — 독립 스택 (카메라 → 미리보기 등 내부 전환 포함) */}
          <Stack.Screen name="QuickAddStack" component={QuickAddNavigator} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
