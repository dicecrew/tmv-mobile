import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';

interface CardProps {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({ title, icon, children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {title && (
        <View style={styles.header}>
          {icon && (
            <Ionicons name={icon} size={22} color={colors.primaryGold} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(25, 25, 25, 0.9)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    letterSpacing: -0.5,
  },
});

export default Card;

