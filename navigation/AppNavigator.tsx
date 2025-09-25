// navigation/AppNavigator.tsx
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { COLORS } from '../constants/theme';
import CalendarScreen from '../screens/CalendarScreen';
import HomeScreen from '../screens/HomeScreen';
import NewEntryScreen from '../screens/NewEntryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ViewEntryScreen from '../screens/ViewEntryScreen';
import { DiaryEntry } from '../types';

/**
 * Defines the parameters for the root stack navigator.
 * This includes the main tab navigator and any global modal screens.
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  ViewEntry: { entryId: number };
  NewEntry: { entry?: DiaryEntry };
};

/**
 * Defines the parameters for the stack navigator nested within the 'Diary' tab.
 */
export type DiaryStackParamList = {
  Home: undefined;
};

/**
 * Defines the parameters for the main bottom tab navigator.
 */
export type RootTabParamList = {
  Diary: NavigatorScreenParams<DiaryStackParamList>;
  Calendar: undefined;
  Profile: undefined;
};

// Prop types for screens
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<DiaryStackParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;


const RootStack = createNativeStackNavigator<RootStackParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * A stack navigator dedicated to the screens within the 'Diary' tab.
 * This currently only includes the main list of entries.
 */
function DiaryStackNavigator() {
  return (
    <DiaryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.card },
        headerTitleStyle: { color: COLORS.textPrimary },
      }}
    >
      <DiaryStack.Screen name="Home" component={HomeScreen} options={{ title: 'My Diary' }} />
    </DiaryStack.Navigator>
  );
}

/**
 * The main user interface, comprising the three primary bottom tabs.
 */
function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Headers are handled by the nested stack or individual screens
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Feather>['name'] = 'alert-circle';
          if (route.name === 'Diary') iconName = 'book-open';
          else if (route.name === 'Calendar') iconName = 'calendar';
          else if (route.name === 'Profile') iconName = 'user';
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.card },
      })}
    >
      <Tab.Screen name="Diary" component={DiaryStackNavigator} />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.textPrimary },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.textPrimary },
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * The root navigator for the entire application.
 * It contains the main tab-based interface and all global modal screens.
 */
export default function AppNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="MainTabs" component={MainTabsNavigator} options={{ headerShown: false }} />
      <RootStack.Group
        screenOptions={{
          presentation: 'modal',
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.textPrimary },
          headerTintColor: COLORS.primary,
        }}
      >
        <RootStack.Screen name="ViewEntry" component={ViewEntryScreen} />
        <RootStack.Screen name="NewEntry" component={NewEntryScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}