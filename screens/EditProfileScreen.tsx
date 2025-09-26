// screens/EditProfileScreen.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import { COLORS, SPACING } from '../constants/theme';
import { auth } from '../services/firebase';
import { useUserStore } from '../store/userStore';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { userProfile, updateUserProfile: updateUserInStore } = useUserStore();
  const authUser = auth.currentUser;

  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setBirthdate(userProfile.birthdate || '');
      setPronouns(userProfile.pronouns || '');
      setBio(userProfile.bio || '');
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!authUser) return;
    const updatedData = { username, birthdate, pronouns, bio };
    await updateUserInStore(authUser.uid, updatedData);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <StyledTextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Your public display name"
        />

        <Text style={styles.label}>Birthdate</Text>
        <StyledTextInput
          value={birthdate}
          onChangeText={setBirthdate}
          placeholder="e.g., January 1, 2000"
        />

        <Text style={styles.label}>Pronouns</Text>
        <StyledTextInput
          value={pronouns}
          onChangeText={setPronouns}
          placeholder="e.g., she/her, they/them"
        />

        <Text style={styles.label}>Bio</Text>
        <StyledTextInput
          value={bio}
          onChangeText={setBio}
          placeholder="A little bit about yourself"
          multiline
          numberOfLines={4}
          style={{ height: 120, paddingTop: SPACING.small }}
        />

        <StyledButton title="Save Changes" onPress={handleSave} style={{ marginTop: SPACING.large }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  form: {
    padding: SPACING.medium,
  },
  label: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.small,
    marginTop: SPACING.medium,
  },
});