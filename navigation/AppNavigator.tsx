// navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import NewEntryScreen from '../screens/NewEntryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ViewEntryScreen from '../screens/ViewEntryScreen';
import { DiaryEntry } from '../types';

export type RootStackParamList = {
  Home: undefined;
  NewEntry: { entry?: DiaryEntry }; 
  ViewEntry: { entryId: number };
  Profile: undefined; // 2. Add Profile to the list of screens
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Diary' }} />
      <Stack.Screen name="NewEntry" component={NewEntryScreen} /> 
      <Stack.Screen name="ViewEntry" component={ViewEntryScreen} />
      {/* 3. Add the new screen to the navigator stack */}
      <Stack.Screen name="Profile" component={ProfileScreen} /> 
    </Stack.Navigator>
  );
}