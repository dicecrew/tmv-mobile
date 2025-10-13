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
import RegistrarApuesta from './RegistrarApuesta';
import MisApuestas from './MisApuestas';
import AprendeAJugar from './AprendeAJugar';

type TabKey = 'placeBet' | 'history' | 'rules';

const JugadorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('placeBet');

  const tabs: Array<{ key: TabKey; title: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { key: 'placeBet', title: 'Registrar', icon: 'flash-outline' },
    { key: 'history', title: 'Mis Apuestas', icon: 'time-outline' },
    { key: 'rules', title: 'Aprende', icon: 'book-outline' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'placeBet':
        return <RegistrarApuesta />;
      case 'history':
        return <MisApuestas />;
      case 'rules':
        return <AprendeAJugar />;
      default:
        return <RegistrarApuesta />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
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
    flexDirection: 'row',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    margin: spacing.sm,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
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

export default JugadorDashboard;

