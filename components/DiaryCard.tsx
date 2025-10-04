import React, { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZES } from '../constants/theme';
import { DiaryEntry } from '../types';

interface DiaryCardProps {
  entry: DiaryEntry;
}

export default function DiaryCard({ entry }: DiaryCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const displayDate = new Date(entry.createdFor).toLocaleDateString();

  return (
    <View style={styles.card}>
      {entry.imageUri && (
        <>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image
              source={{ uri: entry.imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalContainer}
              activeOpacity={1}
              onPressOut={() => setModalVisible(false)}
            >
              <Image
                source={{ uri: entry.imageUri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Modal>
        </>
      )}
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          {entry.emoji && <Text style={styles.emoji}>{entry.emoji}</Text>}
          <Text style={styles.title} numberOfLines={1}>
            {entry.title}
          </Text>
        </View>
        <Text style={styles.date}>{displayDate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    flex: 1,
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});