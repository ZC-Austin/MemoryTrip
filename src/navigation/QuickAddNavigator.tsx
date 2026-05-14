import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QuickAddCameraScreen }       from '../screens/QuickAddCameraScreen';
import { QuickAddGalleryScreen }      from '../screens/QuickAddGalleryScreen';
import { QuickAddPhotoPreviewScreen } from '../screens/QuickAddPhotoPreviewScreen';
import { QuickAddPlaceScreen }        from '../screens/QuickAddPlaceScreen';
import { QuickAddExpenseScreen }      from '../screens/QuickAddExpenseScreen';
import { QuickAddDiaryScreen }        from '../screens/QuickAddDiaryScreen';
import type { QuickAddStackParamList } from './types';

const Stack = createNativeStackNavigator<QuickAddStackParamList>();

export function QuickAddNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="QuickAddCamera"       component={QuickAddCameraScreen} />
      <Stack.Screen name="QuickAddGallery"      component={QuickAddGalleryScreen} />
      <Stack.Screen name="QuickAddPhotoPreview" component={QuickAddPhotoPreviewScreen} />
      <Stack.Screen name="QuickAddPlace"        component={QuickAddPlaceScreen} />
      <Stack.Screen name="QuickAddExpense"      component={QuickAddExpenseScreen} />
      <Stack.Screen name="QuickAddDiary"        component={QuickAddDiaryScreen} />
    </Stack.Navigator>
  );
}
