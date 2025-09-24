// navigation/AppNavigator.tsx
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { COLORS } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import NewEntryScreen from '../screens/NewEntryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ViewEntryScreen from '../screens/ViewEntryScreen';
import { DiaryEntry } from '../types';

// This defines the screens available in our STACK navigator
export type RootStackParamList = {
  Home: undefined;
  NewEntry: { entry?: DiaryEntry }; 
  ViewEntry: { entryId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// This is the stack of screens related to the diary itself
function DiaryStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Diary' }} />
      <Stack.Screen name="NewEntry" component={NewEntryScreen} options={{ title: 'New Entry' }} /> 
      <Stack.Screen name="ViewEntry" component={ViewEntryScreen} />
    </Stack.Navigator>
  );
}

// This is the main Tab Navigator for the app
export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Feather>['name'] = 'alert-circle';
          if (route.name === 'Diary') {
            iconName = 'book-open';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false, // Hides the header for the Tab navigator itself
      })}
    >
      <Tab.Screen name="Diary" component={DiaryStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}