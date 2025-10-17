import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Combobox, { ComboboxOption } from '../common/Combobox';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateRangePicker from '../common/DateRangePicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService, adminService } from '../../api/services';

interface DateData {
  date: string;
  bookieUserName: string;
  totalBets: number;
  validatedBets: number;
  nonValidatedBets: number;
  isCompleted: boolean;
  totalAmount: number;
  revenue: number;
  totalBookiePercentAmount: number;
  totalBookieRevenuePercent: number;
  betResumes?: BetResume[];
}

interface BetResume {
  id: string;
  lotteryName: string;
  throwName: string;
  date: string;
  completed: boolean;
  totalAmount: number;
  revenue: number;
  inicialPool: number;
  endPool: number;
  bookiePercentAmount: number;
  bookieRevenuePercent: number;
  betsCount: number;
  validatedBetsCount: number;
  nonValidatedBetsCount: number;
}

const VerMovimientos: React.FC = () => {
  const [listeros, setListeros] = useState<any[]>([]);
  const [isLoadingBookies, setIsLoadingBookies] = useState(false);
  const [selectedBookie, setSelectedBookie] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [betResumeData, setBetResumeData] = useState<DateData[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Cargar listeros
  const loadListeros = async () => {
    setIsLoadingBookies(true);
    try {
      const response = await bookieService.getBookies();
      
      let bookiesArray: any[] = [];
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        bookiesArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        bookiesArray = response.data;
      }
      
      const mappedListeros = bookiesArray.map((bookie) => ({
        id: bookie.id,
        belongToUserId: bookie.belongToUserId,
        name: bookie.belongToUserName || `${bookie.firstName || ''} ${bookie.lastName || ''}`.trim(),
        phone: bookie.phoneNumber || '',
        pendingAmount: bookie.pool || 0,
      }));
      
      setListeros(mappedListeros);
    } catch (error) {
      console.error('Error loading bookies:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los listeros',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoadingBookies(false);
    }
  };

  useEffect(() => {
    loadListeros();
  }, []);

  // Manejar cambio de rango de fechas
  const handleDateRangeChange = (dateFrom: Date, dateTo: Date) => {
    setDateFrom(dateFrom);
    setDateTo(dateTo);
  };

  // Convertir fecha local a UTC
  const convertLocalDateToUTC = (localDate: Date, isEndDate: boolean = false): string => {
    try {
      const date = new Date(localDate);
      if (isEndDate) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date.toISOString();
    } catch (error) {
      console.error('Error converting date:', error);
      return new Date().toISOString();
    }
  };

  // Aplicar filtros
  const handleApplyFilters = async () => {
    if (dateFrom > dateTo) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La fecha "Desde" no puede ser mayor que "Hasta"',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    setIsLoadingData(true);
    try {
      const params: any = {
        from: convertLocalDateToUTC(dateFrom, false),
        to: convertLocalDateToUTC(dateTo, true),
      };

      if (selectedBookie) {
        params.bookieId = selectedBookie;
      }

      const response = await adminService.getBetResumeSummary(params);
      setBetResumeData(response.data || response || []);
      setShowHistory(true);
    } catch (error: any) {
      console.error('Error fetching bet resume data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudieron cargar los datos',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSelectedBookie('');
    setDateFrom(new Date());
    setDateTo(new Date());
    setShowHistory(false);
    setBetResumeData([]);
    setExpandedDates(new Set());
  };

  // Alternar expansión
  const toggleExpandDate = (dateId: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateId)) {
        newSet.delete(dateId);
      } else {
        newSet.add(dateId);
      }
      return newSet;
    });
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Formatear monto
  const formatAmount = (amount: number): string => {
    if (amount === null || amount === undefined) return '0';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Convertir listeros a opciones del combobox
  const listeroOptions: ComboboxOption[] = listeros.map(listero => ({
    id: listero.id,
    label: `${listero.name}${listero.phone ? ` (${listero.phone})` : ''}`,
    value: listero.id,
  }));

  return (
    <View style={styles.container}>
      <Card title="Ver Jugadas y Movimientos" icon="list-outline" style={styles.card}>
        {/* Filtros */}
        <View style={styles.filtersSection}>
          <View style={styles.formGroup}>
            <Combobox
              options={listeroOptions}
              selectedValue={selectedBookie}
              onValueChange={setSelectedBookie}
              placeholder="-- Todos los listeros --"
              loading={isLoadingBookies}
              loadingText="Cargando..."
              enabled={!isLoadingBookies}
              label="Seleccionar Listero"
              icon="people-outline"
            />
          </View>

          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onRangeChange={handleDateRangeChange}
            label="Rango de Fechas"
            maximumDate={new Date()}
            dateFormat="short"
            showLabels={true}
            required={true}
            helpText="Selecciona el rango de fechas para consultar los movimientos"
          />

          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
              disabled={isLoadingData}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.filterButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoadingData ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={20} color="white" />
                    <Text style={styles.filterButtonText}>APLICAR FILTROS</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearFilters}
              disabled={isLoadingData}
            >
              <LinearGradient
                colors={['#dc2626', '#b91c1c']}
                style={styles.filterButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="close-outline" size={20} color="white" />
                <Text style={styles.filterButtonText}>LIMPIAR</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resultados */}
        {showHistory && !isLoadingData && (
          <ScrollView style={styles.resultsSection}>
            {betResumeData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={48} color={colors.subtleGrey} />
                <Text style={styles.emptyText}>No se encontraron datos</Text>
                <Text style={styles.emptySubtext}>
                  Intenta ajustar el rango de fechas o seleccionar otro listero
                </Text>
              </View>
            ) : (
              betResumeData
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((dateData) => {
                  const isExpanded = expandedDates.has(dateData.date);

                  return (
                    <View key={dateData.date} style={styles.dateCard}>
                      <TouchableOpacity
                        style={styles.dateHeader}
                        onPress={() => toggleExpandDate(dateData.date)}
                      >
                        <View style={styles.dateInfo}>
                          <Text style={styles.dateName}>{dateData.bookieUserName}</Text>
                          <Text style={styles.dateStats}>
                            🎯 Total: {dateData.totalBets} | ✅ Validadas: {dateData.validatedBets} | ⏳ Pendientes:{' '}
                            {dateData.nonValidatedBets}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            dateData.isCompleted ? styles.statusCompleted : styles.statusPending,
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {dateData.isCompleted ? 'COMPLETADO' : 'PENDIENTE'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.dateSummary}>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>TOTAL JUGADO</Text>
                          <Text style={[styles.summaryValue, styles.valueGold]}>
                            ${formatAmount(dateData.totalAmount)}
                          </Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>GANANCIA NETA</Text>
                          <Text
                            style={[
                              styles.summaryValue,
                              dateData.revenue >= 0 ? styles.valuePositive : styles.valueNegative,
                            ]}
                          >
                            ${formatAmount(dateData.revenue)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.expandButton}
                          onPress={() => toggleExpandDate(dateData.date)}
                        >
                          <Ionicons
                            name={isExpanded ? 'eye-off-outline' : 'eye-outline'}
                            size={16}
                            color={colors.primaryGold}
                          />
                          <Text style={styles.expandButtonText}>
                            {isExpanded ? 'Ocultar' : 'Ver'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {isExpanded && dateData.betResumes && (
                        <View style={styles.betResumesList}>
                          <Text style={styles.betResumesTitle}>🎲 Detalle de tiradas:</Text>
                          {dateData.betResumes.map((betResume) => (
                            <View key={betResume.id} style={styles.betResumeItem}>
                              <View style={styles.betResumeHeader}>
                                <View>
                                  <Text style={styles.betResumeName}>
                                    🎰 {betResume.lotteryName} • {betResume.throwName}
                                  </Text>
                                  <Text style={styles.betResumeStats}>
                                    Apuestas: {betResume.betsCount} total ({betResume.validatedBetsCount} validadas,{' '}
                                    {betResume.nonValidatedBetsCount} pendientes)
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    styles.miniStatusBadge,
                                    betResume.completed ? styles.statusCompleted : styles.statusPending,
                                  ]}
                                >
                                  <Text style={styles.miniStatusText}>
                                    {betResume.completed ? '✅' : '⏳'}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.betResumeDetails}>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>Fondo Inicial:</Text>
                                  <Text style={[styles.detailValue, styles.valueBlue]}>
                                    ${formatAmount(betResume.inicialPool || 0)}
                                  </Text>
                                </View>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>Total Jugado:</Text>
                                  <Text style={[styles.detailValue, styles.valueGold]}>
                                    ${formatAmount(betResume.totalAmount || 0)}
                                  </Text>
                                </View>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>Ganancia Neta:</Text>
                                  <Text
                                    style={[
                                      styles.detailValue,
                                      betResume.revenue >= 0 ? styles.valuePositive : styles.valueNegative,
                                    ]}
                                  >
                                    ${formatAmount(betResume.revenue || 0)}
                                  </Text>
                                </View>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>Fondo Final:</Text>
                                  <Text style={[styles.detailValue, styles.valueGreen]}>
                                    ${formatAmount(betResume.endPool || 0)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
            )}
          </ScrollView>
        )}

        {!showHistory && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.subtleGrey} />
            <Text style={styles.emptyTitle}>Selecciona filtros para ver movimientos</Text>
            <Text style={styles.emptySubtext}>
              Elige un listero y un rango de fechas para ver los movimientos
            </Text>
          </View>
        )}
      </Card>

    </View>
  );
};

const formatAmount = (amount: number): string => {
  if (amount === null || amount === undefined) return '0';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  filtersSection: {
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  applyButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  clearButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  filterButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  filterButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  resultsSection: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.subtleGrey,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    textAlign: 'center',
  },
  dateCard: {
    backgroundColor: colors.inputBackground,
    borderWidth: 3,
    borderColor: colors.primaryGold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dateInfo: {
    flex: 1,
  },
  dateName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  dateStats: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusCompleted: {
    backgroundColor: '#22c55e',
  },
  statusPending: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  dateSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  valueGold: {
    color: colors.primaryGold,
  },
  valuePositive: {
    color: '#22c55e',
  },
  valueNegative: {
    color: '#ef4444',
  },
  valueBlue: {
    color: '#3b82f6',
  },
  valueGreen: {
    color: '#10b981',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primaryGold,
    borderRadius: borderRadius.sm,
  },
  expandButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
  },
  betResumesList: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  betResumesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.md,
  },
  betResumeItem: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  betResumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  betResumeName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  betResumeStats: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  miniStatusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatusText: {
    fontSize: fontSize.sm,
  },
  betResumeDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default VerMovimientos;
