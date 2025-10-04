// screens/EditProfileScreen.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Platform, 
  KeyboardAvoidingView, 
  ScrollView, 
  TouchableWithoutFeedback, 
  Keyboard,
  TextInput
} from 'react-native';
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

  // Refs for cursor tracking
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<{ [key: string]: { y: number; height: number } }>({});

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

  // Function to handle field layout measurements
  const handleFieldLayout = (fieldName: string, event: any) => {
    const { y, height } = event.nativeEvent.layout;
    fieldPositions.current[fieldName] = { y, height };
  };

  // Function to scroll to active field with cursor position tracking
  const scrollToField = (fieldName: string) => {
    const fieldPosition = fieldPositions.current[fieldName];
    if (fieldPosition && scrollViewRef.current) {
      const { y, height } = fieldPosition;
      
      // For multiline fields, we need to account for cursor position
      let targetY = y;
      
      // If it's the bio field, add extra space to show more of the field
      if (fieldName === 'bio') {
        // Calculate approximate cursor position based on text content
        const lineHeight = 20; // Approximate line height
        const lines = bio.split('\n').length;
        const approximateCursorY = y + (lines * lineHeight);
        
        // Scroll to show the cursor area with extra padding
        targetY = approximateCursorY - 200; // More padding for cursor area
      } else {
        // For single-line fields, standard padding
        targetY = y - 100;
      }
      
      const scrollY = Math.max(0, targetY);
      scrollViewRef.current?.scrollTo({
        y: scrollY,
        animated: true,
      });
    }
  };

  // Function to handle cursor position changes in multiline fields
  const handleCursorPositionChange = (fieldName: string) => {
    // For multiline fields, re-scroll when cursor position changes
    if (fieldName === 'bio') {
      setTimeout(() => {
        scrollToField(fieldName);
      }, 150); // Slightly longer delay to ensure cursor position is updated
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View 
              onLayout={(event) => handleFieldLayout('username', event)}
              style={styles.fieldContainer}
            >
              <Text style={styles.label}>Username</Text>
              <StyledTextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Your public display name"
                onFocus={() => scrollToField('username')}
              />
            </View>

            <View 
              onLayout={(event) => handleFieldLayout('birthdate', event)}
              style={styles.fieldContainer}
            >
              <Text style={styles.label}>Birthdate</Text>
              <StyledTextInput
                value={birthdate}
                onChangeText={setBirthdate}
                placeholder="e.g., January 1, 2000"
                onFocus={() => scrollToField('birthdate')}
              />
            </View>

            <View 
              onLayout={(event) => handleFieldLayout('pronouns', event)}
              style={styles.fieldContainer}
            >
              <Text style={styles.label}>Pronouns</Text>
              <StyledTextInput
                value={pronouns}
                onChangeText={setPronouns}
                placeholder="e.g., she/her, they/them"
                onFocus={() => scrollToField('pronouns')}
              />
            </View>

            <View 
              onLayout={(event) => handleFieldLayout('bio', event)}
              style={styles.fieldContainer}
            >
              <Text style={styles.label}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={(text) => {
                setBio(text);
                // Use enhanced scroll for bio field
                setTimeout(() => scrollToField('bio'), 100);
              }}
              placeholder="A little bit about yourself"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              style={styles.bioInput}
              textAlignVertical="top"
              returnKeyType="default"
              blurOnSubmit={false}
              onFocus={() => scrollToField('bio')}
              onSelectionChange={() => {
                // Use enhanced scroll for bio field
                setTimeout(() => scrollToField('bio'), 100);
              }}
            />
            </View>

            <StyledButton title="Save Changes" onPress={handleSave} style={{ marginTop: SPACING.large }} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  form: {
    padding: SPACING.medium,
  },
  fieldContainer: {
    marginBottom: SPACING.medium,
  },
  label: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.small,
    marginTop: SPACING.medium,
  },
  bioInput: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.textPrimary,
    height: 120,
    textAlignVertical: 'top',
  },
});