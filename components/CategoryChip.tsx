// components/CategoryChip.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Category } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';

interface CategoryChipProps {
  category: Category;
  onPress?: () => void;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showIcon?: boolean;
}

export default function CategoryChip({ 
  category, 
  onPress, 
  selected = false, 
  size = 'medium',
  style,
  showIcon = true 
}: CategoryChipProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: SPACING.small,
          paddingVertical: 4,
          borderRadius: 12,
          fontSize: FONT_SIZES.caption,
        };
      case 'large':
        return {
          paddingHorizontal: SPACING.medium,
          paddingVertical: SPACING.small,
          borderRadius: 20,
          fontSize: FONT_SIZES.body,
        };
      default: // medium
        return {
          paddingHorizontal: SPACING.small + 4,
          paddingVertical: 6,
          borderRadius: 16,
          fontSize: FONT_SIZES.caption,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? category.color : COLORS.background,
          borderColor: category.color,
          borderWidth: selected ? 0 : 1,
          ...sizeStyles,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showIcon && category.icon && (
        <Text style={[styles.icon, { fontSize: sizeStyles.fontSize }]}>
          {category.icon}
        </Text>
      )}
      <Text
        style={[
          styles.text,
          {
            color: selected ? COLORS.card : category.color,
            fontSize: sizeStyles.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginRight: SPACING.small,
    marginBottom: SPACING.small,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
