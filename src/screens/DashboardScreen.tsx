import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/GlobalStyles';
import Toast from 'react-native-toast-message';
import AdminDashboard from '../components/admin/AdminDashboard';
import ListeroDashboard from '../components/listero/ListeroDashboard';
import JugadorDashboard from '../components/jugador/JugadorDashboard';

const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Determinar si es jugador (todos los roles usan el header compacto)
  const isJugador = true;

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    Toast.show({
      type: 'success',
      text1: 'Sesión cerrada',
      text2: 'Has cerrado sesión correctamente',
      position: 'top',
      topOffset: 60,
    });
    navigation.replace('Login');
  };

  const renderDashboardContent = () => {
    if (!user) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.infoText}>
            Por favor, inicia sesión para ver el contenido del dashboard.
          </Text>
        </View>
      );
    }
    
    const normalizedRoleName = user.roleName?.toLowerCase();
    
    switch (normalizedRoleName) {
      case 'superadmin':
      case 'administrator':
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'bookie':
      case 'listero':
        return <ListeroDashboard />;
      case 'user':
      case 'jugador':
        return <JugadorDashboard />;
      default:
        return (
          <View style={styles.centerContent}>
            <Text style={styles.infoText}>
              Dashboard General - Rol: {user.roleName}
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(30, 30, 30, 0.98)', 'rgba(30, 30, 30, 0.95)']}
        style={[styles.header, isJugador && styles.headerCompact]}
      >
        {/* Logo */}
        <TouchableOpacity style={[styles.logoContainer, isJugador && styles.logoCompact]}>
          <LinearGradient
            colors={[colors.primaryGold, colors.primaryRed]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={require('../assets/tmv_app_thumbnail.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* App Name */}
        <View style={styles.appNameContainer}>
          <Text style={[styles.appName, isJugador && styles.appNameCompact]}>
            The Money Vice
          </Text>
        </View>

        {/* User Info */}
        <TouchableOpacity
          style={[styles.userInfo, isJugador && styles.userInfoCompact]}
          onPress={() => setShowDropdown(true)}
        >
          <LinearGradient
            colors={[colors.primaryGold, colors.primaryRed]}
            style={[styles.avatar, isJugador && styles.avatarCompact]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name="person"
              size={isJugador ? 20 : 24}
              color={colors.darkBackground}
            />
          </LinearGradient>
          <View style={styles.userDetails}>
            <Text
              style={[styles.userName, isJugador && styles.userNameCompact]}
              numberOfLines={1}
            >
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario' : 'Invitado'}
            </Text>
            <View style={styles.roleContainer}>
              <Ionicons
                name="shield"
                size={isJugador ? 12 : 16}
                color={colors.primaryRed}
              />
              <Text style={[styles.userRole, isJugador && styles.userRoleCompact]}>
                {user ? user.roleName : 'No disponible'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {renderDashboardContent()}
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(false);
                // Navigate to edit profile
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.lightText} />
              <Text style={styles.dropdownText}>Editar Perfil</Text>
            </TouchableOpacity>
            
            {/* Ocultar opción de cambiar contraseña para bookie/listero */}
            {user && !['bookie', 'listero'].includes(user.roleName?.toLowerCase() || '') && (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowDropdown(false);
                  // Navigate to change password
                }}
              >
                <Ionicons name="key-outline" size={20} color={colors.lightText} />
                <Text style={styles.dropdownText}>Cambiar Contraseña</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.dropdownDivider} />
            
            <TouchableOpacity
              style={[styles.dropdownItem, styles.dropdownItemDanger]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.primaryRed} />
              <Text style={[styles.dropdownText, styles.dropdownTextDanger]}>
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.darkBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  headerCompact: {
    paddingVertical: spacing.md,
  },
  logoContainer: {
    marginRight: spacing.md,
  },
  logoCompact: {
    marginRight: spacing.sm,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '75%',
    height: '75%',
  },
  appNameContainer: {
    flex: 1,
    alignItems: 'center',
  },
  appName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    letterSpacing: -1,
  },
  appNameCompact: {
    fontSize: fontSize.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userInfoCompact: {
    padding: spacing.xs,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  userNameCompact: {
    fontSize: fontSize.md,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userRole: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    fontWeight: fontWeight.medium,
  },
  userRoleCompact: {
    fontSize: fontSize.xs,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.lightText,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: spacing.lg,
  },
  dropdownContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    minWidth: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  dropdownItemDanger: {
    backgroundColor: 'rgba(176, 0, 0, 0.1)',
  },
  dropdownText: {
    fontSize: fontSize.md,
    color: colors.lightText,
    fontWeight: fontWeight.medium,
  },
  dropdownTextDanger: {
    color: colors.primaryRed,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginVertical: spacing.xs,
  },
});

export default DashboardScreen;
