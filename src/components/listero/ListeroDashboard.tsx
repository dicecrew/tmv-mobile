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
import GestionarJugadores from './GestionarJugadores';
import RealizarApuesta from './RealizarApuesta';
import ValidacionApuestas from './ValidacionApuestas';
import VerHistorial from './VerHistorial';

type TabKey = 'managePlayers' | 'placeBet' | 'validateBets' | 'history';

const ListeroDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('managePlayers');

  const tabs: Array<{ key: TabKey; title: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { key: 'managePlayers', title: 'Jugadores', icon: 'person-add-outline' },
    { key: 'placeBet', title: 'Registrar Apuesta', icon: 'flash-outline' },
    { key: 'validateBets', title: 'Validar', icon: 'checkmark-circle-outline' },
    { key: 'history', title: 'Historial', icon: 'time-outline' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'managePlayers':
        return <GestionarJugadores />;
      case 'placeBet':
        return <RealizarApuesta />;
      case 'validateBets':
        return <ValidacionApuestas />;
      case 'history':
        return <VerHistorial />;
      default:
        return <GestionarJugadores />;
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
      <ScrollView style={styles.content}>
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

export default ListeroDashboard;

