import { DefaultTheme } from 'styled-components/native';

// Colores basados en el logo (Dorado y Rojo)
export const colors = {
  primaryGold: '#D4AF37', // Dorado
  primaryRed: '#B00000', // Rojo
  darkBackground: '#1A1A1A', // Negro muy oscuro
  lightText: '#E0E0E0', // Gris claro para texto
  subtleGrey: '#A0A0A0', // Gris sutil para subtítulos
  inputBackground: '#1E1E1E', // Gris oscuro para inputs
  inputBorder: '#333333', // Borde oscuro para inputs
  errorBackground: 'rgba(176, 0, 0, 0.1)', // Rojo muy sutil para error
  errorBorder: '#B00000', // Borde rojo para error
  errorText: '#FF6666', // Texto rojo para error
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Tema para styled-components
export const theme: DefaultTheme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 12,
    },
    gold: {
      shadowColor: colors.primaryGold,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    red: {
      shadowColor: colors.primaryRed,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Estilos comunes para componentes
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.darkBackground,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  text: {
    color: colors.lightText,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.normal,
  },
  title: {
    color: colors.primaryGold,
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
  },
  subtitle: {
    color: colors.subtleGrey,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.normal,
  },
  error: {
    color: colors.errorText,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  button: {
    backgroundColor: colors.primaryGold,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonText: {
    color: colors.darkBackground,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: colors.lightText,
    fontSize: theme.fontSize.md,
  },
  card: {
    backgroundColor: 'rgba(25, 25, 25, 0.9)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
};

export default theme;
