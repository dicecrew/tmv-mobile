import { StyleSheet, Platform } from 'react-native';

// Colores basados en el logo (Dorado y Rojo)
export const colors = {
  primaryGold: '#D4AF37', // Dorado
  primaryRed: '#B00000', // Rojo
  darkBackground: '#1A1A1A', // Negro muy oscuro
  lightText: '#E0E0E0', // Gris claro para texto
  subtleGrey: '#A0A0A0', // Gris sutil para subtítulos
  inputBackground: '#1E1E1E', // Gris oscuro para inputs
  inputBorder: '#333333', // Borde oscuro para inputs
  cardBackground: '#2A2A2A', // Fondo de tarjetas
  errorBackground: 'rgba(176, 0, 0, 0.1)', // Rojo muy sutil para error
  errorBorder: '#B00000', // Borde rojo para error
  errorText: '#FF6666', // Texto rojo para error
  successColor: '#22c55e', // Verde para éxito
  warningColor: '#f59e0b', // Naranja para advertencia
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Espaciado
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Radio de borde
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Tamaños de fuente
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

// Pesos de fuente
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

// Sombras
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    android: {
      elevation: 3,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 5,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
    },
    android: {
      elevation: 8,
    },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
    },
    android: {
      elevation: 12,
    },
  }),
  gold: Platform.select({
    ios: {
      shadowColor: colors.primaryGold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
  red: Platform.select({
    ios: {
      shadowColor: colors.primaryRed,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
};

// Estilos globales usando StyleSheet
export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBackground,
  },
  scrollContainer: {
    flex: 1,
  },
  screenPadding: {
    padding: spacing.lg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.darkBackground,
  },
  // Estilos de texto
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.subtleGrey,
    fontWeight: fontWeight.normal,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: fontSize.md,
    color: colors.lightText,
    lineHeight: 24,
  },
  // Estilos de tarjetas
  card: {
    backgroundColor: 'rgba(25, 25, 25, 0.9)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    ...(shadows.lg || {}),
  },
  // Estilos de inputs
  input: {
    width: '100%',
    padding: spacing.md,
    fontSize: fontSize.md,
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    color: colors.lightText,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.sm,
  },
  // Estilos de botones
  button: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.darkBackground,
  },
  // Estilos de mensajes de error
  errorContainer: {
    backgroundColor: colors.errorBackground,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  errorText: {
    color: colors.errorText,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  // Centrado
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Flex layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

// Gradientes para LinearGradient
export const gradients = {
  primaryButton: {
    colors: [colors.primaryGold, colors.primaryRed],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  darkBackground: {
    colors: ['rgba(30, 30, 30, 0.95)', 'rgba(30, 30, 30, 0.98)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  logo: {
    colors: [colors.primaryGold, colors.primaryRed],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  gradients,
  GlobalStyles,
};
