// screens/FirstTimeProfileSetupScreen.tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { auth } from '../services/firebase';
import { useUserStore } from '../store/userStore';
import { RootStackScreenProps } from '../navigation/AppNavigator';

type Props = RootStackScreenProps<'FirstTimeProfileSetup'>;

export default function FirstTimeProfileSetupScreen({ navigation }: Props) {
  const { createInitialProfile } = useUserStore();
  const authUser = auth.currentUser;

  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string }>({});

  const validateForm = () => {
    const newErrors: { username?: string } = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    } else if (username.trim().length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompleteSetup = async () => {
    if (!authUser) {
      Alert.alert('Error', 'Authentication error. Please try signing in again.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('👤 Creating initial profile for first-time user...');
      
      // Prepare profile data, only including non-empty optional fields
      const profileData: { 
        username: string; 
        birthdate?: string; 
        pronouns?: string; 
        bio?: string; 
      } = {
        username: username.trim(),
      };

      // Only add optional fields if they have values
      const trimmedBirthdate = birthdate.trim();
      const trimmedPronouns = pronouns.trim();
      const trimmedBio = bio.trim();

      if (trimmedBirthdate) profileData.birthdate = trimmedBirthdate;
      if (trimmedPronouns) profileData.pronouns = trimmedPronouns;
      if (trimmedBio) profileData.bio = trimmedBio;

      await createInitialProfile(authUser.uid, profileData);
      
      console.log('✅ Profile setup completed successfully');
      // Navigation will be handled by App.tsx based on the updated profile state
    } catch (error) {
      console.error('❌ Error creating initial profile:', error);
      Alert.alert(
        'Setup Failed',
        'There was an error setting up your profile. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => setIsLoading(false),
          },
        ]
      );
    }
  };

  const handleSkipOptional = (field: 'birthdate' | 'pronouns' | 'bio') => {
    switch (field) {
      case 'birthdate':
        setBirthdate(' ');
        break;
      case 'pronouns':
        setPronouns(' ');
        break;
      case 'bio':
        setBio(' ');
        break;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Setting up your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Your Diary! 📖</Text>
          <Text style={styles.subtitle}>
            Let's set up your profile to get started.
            You can always update your profile information later in the settings.
          </Text>            
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Username <Text style={styles.required}>*</Text>
            </Text>
            <StyledTextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Your display name"
              error={!!errors.username}
              maxLength={30}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Birthdate</Text>
              <Text style={styles.optional}>(optional)</Text>
            </View>
            <StyledTextInput
              value={birthdate}
              onChangeText={setBirthdate}
              placeholder="e.g., January 1, 2000"
            />
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Pronouns</Text>
              <Text style={styles.optional}>(optional)</Text>
            </View>
            <StyledTextInput
              value={pronouns}
              onChangeText={setPronouns}
              placeholder="e.g., she/her, they/them"
            />
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.optional}>(optional)</Text>
            </View>
            <StyledTextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us a little about yourself"
              multiline
              numberOfLines={4}
              style={styles.bioInput}
            />
          </View>

          <View style={styles.buttonContainer}>
            <StyledButton
              title="Complete Setup"
              onPress={handleCompleteSetup}
              disabled={!username.trim() || isLoading}
            />
          </View>

          
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.medium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
    paddingTop: SPACING.large,
  },
  header: {
    marginBottom: SPACING.large * 2,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.medium,
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.medium,
  },
  form: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: SPACING.large,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  label: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  required: {
    color: COLORS.error,
  },
  optional: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.small,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.error,
    marginTop: 4,
  },
  bioInput: {
    height: 120,
    paddingTop: SPACING.medium,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: SPACING.large,
    marginBottom: SPACING.medium,
  },
  note: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: SPACING.medium,
  },
});
