import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';

const AprendeAJugar: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Card title="Aprende a Jugar" icon="book-outline" style={styles.card}>
        <Text style={styles.description}>
          Conoce los diferentes tipos de jugadas y sus pagos correspondientes.
        </Text>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>🎲</Text>
          <Text style={styles.heroTitle}>¡Bienvenido a la Lotería!</Text>
          <Text style={styles.heroSubtitle}>
            Descubre cómo jugar y ganar en nuestras loterías oficiales
          </Text>
        </View>

        {/* Tipos de Jugadas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={18} color={colors.primaryGold} />
            <Text style={styles.sectionTitle}>Tipos de Jugadas y Sus Pagos</Text>
          </View>

          {/* FIJO */}
          <View style={[styles.playTypeCard, { borderColor: '#2563eb' }]}>
            <View style={[styles.playTypeIcon, { backgroundColor: '#2563eb' }]}>
              <Text style={styles.playTypeIconText}>🎯</Text>
            </View>
            <Text style={[styles.playTypeName, { color: '#2563eb' }]}>FIJO</Text>
            <View style={[styles.payoutBox, { backgroundColor: '#2563eb' }]}>
              <Text style={styles.payoutLabel}>PAGA</Text>
              <Text style={styles.payoutAmount}>$80x</Text>
            </View>
            <Text style={[styles.playTypeDescription, { color: '#2563eb' }]}>
              ⚡ Se paga como fijo Y corrido
            </Text>
          </View>

          {/* CORRIDO */}
          <View style={[styles.playTypeCard, { borderColor: '#16a34a' }]}>
            <View style={[styles.playTypeIcon, { backgroundColor: '#16a34a' }]}>
              <Text style={styles.playTypeIconText}>🔄</Text>
            </View>
            <Text style={[styles.playTypeName, { color: '#16a34a' }]}>CORRIDO</Text>
            <View style={[styles.payoutBox, { backgroundColor: '#16a34a' }]}>
              <Text style={styles.payoutLabel}>PAGA</Text>
              <Text style={styles.payoutAmount}>$25x</Text>
            </View>
            <Text style={[styles.playTypeDescription, { color: '#16a34a' }]}>
              🎲 Cualquier orden (2 cifras)
            </Text>
          </View>

          {/* CENTENA */}
          <View style={[styles.playTypeCard, { borderColor: '#7c3aed' }]}>
            <View style={[styles.playTypeIcon, { backgroundColor: '#7c3aed' }]}>
              <Text style={styles.playTypeIconText}>💯</Text>
            </View>
            <Text style={[styles.playTypeName, { color: '#7c3aed' }]}>CENTENA</Text>
            <View style={[styles.payoutBox, { backgroundColor: '#7c3aed' }]}>
              <Text style={styles.payoutLabel}>PAGA</Text>
              <Text style={styles.payoutAmount}>$600x</Text>
            </View>
            <Text style={[styles.playTypeDescription, { color: '#7c3aed' }]}>
              ⚠️ Solo centena exacta
            </Text>
          </View>

          {/* PARLET */}
          <View style={[styles.playTypeCard, { borderColor: '#dc2626' }]}>
            <View style={[styles.playTypeIcon, { backgroundColor: '#dc2626' }]}>
              <Text style={styles.playTypeIconText}>🎰</Text>
            </View>
            <View style={styles.parletHeader}>
              <Text style={[styles.playTypeName, { color: '#dc2626' }]}>PARLET</Text>
              <View style={styles.jackpotBadge}>
                <Text style={styles.jackpotText}>JACKPOT</Text>
              </View>
            </View>
            <View style={[styles.payoutBox, { backgroundColor: '#dc2626' }]}>
              <Text style={styles.payoutLabel}>PAGA</Text>
              <Text style={styles.payoutAmount}>$1,000x</Text>
            </View>
            <Text style={[styles.playTypeDescription, { color: '#dc2626' }]}>
              🔥 Dos números combinados
            </Text>
          </View>
        </View>

        {/* Horarios */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={colors.primaryGold} />
            <Text style={styles.sectionTitle}>Horarios de Cierre por Estado</Text>
          </View>

          {/* Florida */}
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleEmoji}>🌴</Text>
              <Text style={styles.scheduleState}>FLORIDA</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Mediodía</Text>
              <Text style={styles.scheduleTime}>12:20 PM</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Noche</Text>
              <Text style={styles.scheduleTime}>8:30 PM</Text>
            </View>
          </View>

          {/* Georgia */}
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleEmoji}>🍑</Text>
              <Text style={styles.scheduleState}>GEORGIA</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Día</Text>
              <Text style={styles.scheduleTime}>11:15 AM</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Tarde</Text>
              <Text style={styles.scheduleTime}>5:45 PM</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Noche</Text>
              <Text style={styles.scheduleTime}>10:15 PM</Text>
            </View>
          </View>

          {/* New York */}
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleEmoji}>🗽</Text>
              <Text style={styles.scheduleState}>NEW YORK</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Mediodía</Text>
              <Text style={styles.scheduleTime}>1:20 PM</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Noche</Text>
              <Text style={styles.scheduleTime}>9:20 PM</Text>
            </View>
          </View>

          {/* Zona Horaria Notice */}
          <View style={styles.timezoneNotice}>
            <View style={styles.timezoneHeader}>
              <Text style={styles.timezoneEmoji}>⏰</Text>
              <Text style={styles.timezoneTitle}>¡IMPORTANTE! - HORA DE TEXAS</Text>
            </View>
            <Text style={styles.timezoneText}>
              Todos los horarios están en <Text style={styles.bold}>Zona Horaria de Texas (CST/CDT)</Text>
            </Text>
          </View>
        </View>

        {/* Términos y Condiciones */}
        <View style={styles.termsCard}>
          <View style={styles.termsHeader}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primaryRed} />
            <Text style={styles.termsTitle}>Términos y Condiciones Importantes</Text>
          </View>
          <View style={styles.termsContent}>
            <Text style={styles.termItem}>
              <Text style={styles.termBullet}>•</Text>{' '}
              <Text style={styles.termLabel}>Forma de pago:</Text> Los pagos mostrados son por cada $1
              USD apostado
            </Text>
            <Text style={styles.termItem}>
              <Text style={styles.termBullet}>•</Text>{' '}
              <Text style={styles.termLabel}>Cancelación automática:</Text> Si no paga su jugada antes
              de que salga el número ganador, su jugada quedará automáticamente cancelada
            </Text>
            <Text style={styles.termItem}>
              <Text style={styles.termBullet}>•</Text>{' '}
              <Text style={styles.termLabel}>Tiempo de pago:</Text> Los listeros tienen hasta 24 horas
              para pagar los premios ganadores
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  heroBanner: {
    backgroundColor: `${colors.primaryGold}15`,
    borderWidth: 3,
    borderColor: colors.primaryGold,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
  },
  playTypeCard: {
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  playTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  playTypeIconText: {
    fontSize: 14,
  },
  playTypeName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    marginBottom: spacing.sm,
  },
  parletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  jackpotBadge: {
    backgroundColor: colors.primaryGold,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 3,
  },
  jackpotText: {
    fontSize: 8,
    fontWeight: fontWeight.heavy,
    color: colors.darkBackground,
  },
  payoutBox: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    minWidth: 120,
  },
  payoutLabel: {
    fontSize: fontSize.xs,
    color: 'white',
    opacity: 0.9,
  },
  payoutAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: 'white',
  },
  playTypeDescription: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  scheduleCard: {
    backgroundColor: `${colors.primaryGold}10`,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  scheduleEmoji: {
    fontSize: 20,
  },
  scheduleState: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.xs,
  },
  scheduleLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.subtleGrey,
  },
  scheduleTime: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    color: colors.lightText,
  },
  timezoneNotice: {
    backgroundColor: `${colors.primaryRed}20`,
    borderWidth: 2,
    borderColor: colors.primaryRed,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  timezoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  timezoneEmoji: {
    fontSize: 18,
  },
  timezoneTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    color: colors.primaryRed,
  },
  timezoneText: {
    fontSize: fontSize.xs,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: 16,
  },
  bold: {
    fontWeight: fontWeight.bold,
  },
  termsCard: {
    backgroundColor: `${colors.primaryRed}15`,
    borderWidth: 2,
    borderColor: colors.primaryRed,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  termsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    color: colors.primaryRed,
  },
  termsContent: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: `${colors.primaryRed}33`,
  },
  termItem: {
    fontSize: fontSize.xs,
    color: colors.lightText,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  termBullet: {
    color: colors.primaryRed,
    fontWeight: fontWeight.bold,
  },
  termLabel: {
    color: colors.primaryRed,
    fontWeight: fontWeight.bold,
  },
});

export default AprendeAJugar;
