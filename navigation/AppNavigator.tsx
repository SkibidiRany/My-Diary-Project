// navigation/AppNavigator.tsx
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { COLORS } from '../constants/theme';
import CalendarScreen from '../screens/CalendarScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import NewEntryScreen from '../screens/NewEntryScreen';
import ProfileScreen from '../screens/ProfileScreen_Fallback';
import SetMasterPasswordScreen from '../screens/SetMasterPasswordScreen';
import UnlockDiaryScreen from '../screens/UnlockDiaryScreen';
import ViewEntryScreen from '../screens/ViewEntryScreen';
import DebugScreen from '../screens/DebugScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ExportImportScreen from '../screens/ExportImportScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import FirstTimeProfileSetupScreen from '../screens/FirstTimeProfileSetupScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import { DiaryEntry } from '../types';

/**
 * Defines the parameters for the root stack navigator.
 * This includes the main tab navigator and any global modal screens.
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  FirstTimeProfileSetup: undefined;
  SetMasterPassword: undefined;
  UnlockDiary: undefined;
  Debug: undefined;
  ViewEntry: { entryId: number };
  NewEntry: { entry?: DiaryEntry; createdForDate?: string };
  EditProfile: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

/**
 * Defines the parameters for the settings stack navigator.
 */
export type SettingsStackParamList = {
  SettingsHome: undefined;
  ExportImport: undefined;
  SecuritySettings: undefined;
  CategoryManagement: undefined;
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
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
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
 * A stack navigator for settings-related screens.
 */
function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.card },
        headerTitleStyle: { color: COLORS.textPrimary },
        headerTintColor: COLORS.primary,
      }}
    >
      <SettingsStack.Screen 
        name="SettingsHome" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />
      <SettingsStack.Screen 
        name="ExportImport" 
        component={ExportImportScreen} 
        options={{ title: 'Export & Import' }} 
      />
      <SettingsStack.Screen 
        name="SecuritySettings" 
        component={SecuritySettingsScreen} 
        options={{ title: 'Security Settings' }} 
      />
      <SettingsStack.Screen 
        name="CategoryManagement" 
        component={CategoryManagementScreen} 
        options={{ title: 'Manage Categories' }} 
      />
    </SettingsStack.Navigator>
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
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * The root navigator for the entire application.
 * It contains the main tab-based interface and all global modal screens.
 */
interface AppNavigatorProps {
  initialRouteName?: 'FirstTimeProfileSetup' | 'SetMasterPassword' | 'UnlockDiary' | 'MainTabs';
}

export default function AppNavigator({ initialRouteName = 'MainTabs' }: AppNavigatorProps = {}) {
  return (
    <RootStack.Navigator initialRouteName={initialRouteName}>
      <RootStack.Screen name="MainTabs" component={MainTabsNavigator} options={{ headerShown: false }} />
      <RootStack.Screen 
        name="FirstTimeProfileSetup" 
        component={FirstTimeProfileSetupScreen} 
        options={{ 
          title: 'Profile Setup',
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.textPrimary },
          headerTintColor: COLORS.primary,
          headerBackVisible: false, // Prevent going back during setup
        }} 
      />
      <RootStack.Screen 
        name="SetMasterPassword" 
        component={SetMasterPasswordScreen} 
        options={{ 
          title: 'Set Master Password',
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.textPrimary },
          headerTintColor: COLORS.primary,
        }} 
      />
      <RootStack.Screen 
        name="UnlockDiary" 
        component={UnlockDiaryScreen} 
        options={{ 
          title: 'Unlock Diary',
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.textPrimary },
          headerTintColor: COLORS.primary,
        }} 
      />
      <RootStack.Screen 
        name="Debug" 
        component={DebugScreen} 
        options={{ 
          title: 'Debug Security',
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.textPrimary },
          headerTintColor: COLORS.primary,
        }} 
      />
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
        <RootStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
        <RootStack.Screen name="Settings" component={SettingsStackNavigator} options={{ headerShown: false }} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}