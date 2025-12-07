import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import RegistrarGanador from './RegistrarGanador';
import CerrarTiradas from './CerrarTiradas';
import VerMovimientos from './VerMovimientos';
import RegistrarRecaudacion from './RegistrarRecaudacion';
import GestionarListeros from './GestionarListeros';
import GestionarTiradas from './GestionarTiradas';
import ReporteRecaudacion from './ReporteRecaudacion';
import GestionarAdministradores from './GestionarAdministradores';

interface AdminDashboardProps {
  user: any;
}

type TabKey = 'manageLottery' | 'closeDraws' | 'viewMovements' | 'registerCollection' | 
               'manageListeros' | 'manageThrows' | 'reports' | 'manageAdmins';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('manageListeros');
  
  // Verificar si el usuario es superadmin
  const isSuperAdmin = user?.roleName?.toLowerCase() === 'superadmin';

  const tabs: Array<{ key: TabKey; title: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { key: 'manageLottery', title: 'Ganador', icon: 'trophy-outline' },
    { key: 'closeDraws', title: 'Cerrar', icon: 'lock-closed-outline' },
    { key: 'viewMovements', title: 'Movimientos', icon: 'list-outline' },
    { key: 'registerCollection', title: 'Recaudación', icon: 'cash-outline' },
    { key: 'manageListeros', title: 'Listeros', icon: 'people-outline' },
    { key: 'manageThrows', title: 'Tiradas', icon: 'time-outline' },
    { key: 'reports', title: 'Reportes', icon: 'bar-chart-outline' },
  ];

  if (isSuperAdmin) {
    tabs.push({ key: 'manageAdmins', title: 'Admins', icon: 'settings-outline' });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'manageLottery':
        return <RegistrarGanador />;
      case 'closeDraws':
        return <CerrarTiradas />;
      case 'viewMovements':
        return <VerMovimientos />;
      case 'registerCollection':
        return <RegistrarRecaudacion />;
      case 'manageListeros':
        return <GestionarListeros />;
      case 'manageThrows':
        return <GestionarTiradas />;
      case 'reports':
        return <ReporteRecaudacion />;
      case 'manageAdmins':
        return <GestionarAdministradores />;
      default:
        return <GestionarListeros />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? colors.darkBackground : colors.subtleGrey}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} nestedScrollEnabled>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    margin: spacing.sm,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  tabsContent: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.primaryGold,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.subtleGrey,
  },
  tabTextActive: {
    color: colors.darkBackground,
  },
  content: {
    flex: 1,
    padding: spacing.sm,
  },
  contentCard: {
    minHeight: 200,
  },
  placeholderText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subText: {
    fontSize: fontSize.md,
    color: colors.subtleGrey,
    textAlign: 'center',
  },
});

export default AdminDashboard;

