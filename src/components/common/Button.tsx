import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return [colors.primaryGold, colors.primaryRed];
      case 'secondary':
        return [colors.inputBackground, colors.inputBorder];
      case 'success':
        return ['#22c55e', '#16a34a'];
      case 'danger':
        return [colors.primaryRed, '#8B0000'];
      case 'warning':
        return ['#f59e0b', '#d97706'];
      default:
        return [colors.primaryGold, colors.primaryRed];
    }
  };

  const getTextColor = () => {
    if (variant === 'secondary') {
      return colors.lightText;
    }
    return colors.darkBackground;
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={getColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={getTextColor()} />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={getTextColor()}
              />
            )}
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;

