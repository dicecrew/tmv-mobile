import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';

const { width } = Dimensions.get('window');

interface CustomToastProps {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  onHide?: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({
  visible,
  type,
  title,
  message,
  duration = 3000,
  onHide
}) => {
  React.useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onHide?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: '#ffffff',
          backgroundColor: '#10b981',
          borderColor: '#059669',
          titleColor: '#ffffff',
          messageColor: '#f0fdf4'
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          iconColor: '#ffffff',
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          titleColor: '#ffffff',
          messageColor: '#fef2f2'
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          iconColor: '#ffffff',
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          titleColor: '#ffffff',
          messageColor: '#fffbeb'
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: '#ffffff',
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          titleColor: '#ffffff',
          messageColor: '#eff6ff'
        };
    }
  };

  const config = getToastConfig();

  return (
    <View style={styles.container}>
      <View style={[
        styles.toast,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        }
      ]}>
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: config.titleColor }]}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.message, { color: config.messageColor }]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    elevation: 10,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    minHeight: 70,
  },
  iconContainer: {
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default CustomToast;
