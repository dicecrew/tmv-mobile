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
  totalInicialPool: number;
  totalEndPool: number;
  totalBookiePercentAmount: number;
  totalRevenueAcumulado: number;
  totalProfit: number;
  totalBookieRevenuePercent: number;
  betResumes?: BetResume[];
}

interface ThrowResult {
  id: string;
  throwId: string;
  throwName: string;
  date: string;
  centena: string;
  corrido1: string;
  corrido2: string;
  totalProfit: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string | null;
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
  throwResult?: ThrowResult | null;
  bets?: Bet[];
}

interface Bet {
  id: string;
  userName: string;
  userId: string;
  date: string;
  stateCode: string;
  betPlays?: BetPlay[];
}

interface BetPlay {
  playTypeName: string;
  moves?: Move[];
}

interface Move {
  totalAmount: number;
  profit: number;
  numbers?: string;
  playTypeName?: string;
  moveDetails?: MoveDetail[];
}

interface MoveDetail {
  number: string;
  secondNumber?: string;
  amount: number;
  profit?: number;
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
  const [expandedBetResumes, setExpandedBetResumes] = useState<Set<string>>(new Set());
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set());

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

  // Convertir fecha local a ISO string (manteniendo el offset de zona horaria)
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

      // Manejar la respuesta correctamente
      let dataToSet: DateData[] = [];
      
      if (response.data) {
        // Si response.data existe, usarlo
        if (Array.isArray(response.data)) {
          dataToSet = response.data;
        } else if (typeof response.data === 'object') {
          // Si es un objeto, intentar convertir a array
          dataToSet = Object.values(response.data);
        }
      } else if (Array.isArray(response)) {
        // Si response es directamente un array
        dataToSet = response;
      }

      setBetResumeData(dataToSet);
      setShowHistory(true);

      if (dataToSet.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'Sin resultados',
          text2: 'No se encontraron movimientos para los filtros seleccionados',
          position: 'top',
          topOffset: 60,
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching bet resume data:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'No se pudieron cargar los datos',
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
    setExpandedBetResumes(new Set());
    setExpandedBets(new Set());
  };

  // Alternar expansión de fechas
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

  // Alternar expansión del BetResume
  const toggleExpandBetResume = (betResumeId: string) => {
    setExpandedBetResumes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(betResumeId)) {
        newSet.delete(betResumeId);
      } else {
        newSet.add(betResumeId);
      }
      return newSet;
    });
  };

  // Alternar expansión de una apuesta individual
  const toggleExpandBet = (betId: string) => {
    setExpandedBets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return `${day}/${month}/${year}, ${time}`;
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Formatear monto
  const formatAmount = (amount: number): string => {
    if (amount === null || amount === undefined) return '0';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Color por tipo de apuesta
  const getBetTypeColor = (type: string): string => {
    switch (type) {
      case 'FIJO':
      case 'Fijo':
        return '#2563eb'; // Azul
      case 'CORRIDO':
      case 'Corrido':
        return '#16a34a'; // Verde
      case 'CENTENA':
      case 'Centena':
        return '#7c3aed'; // Morado
      case 'PARLET':
      case 'Parlet':
        return '#dc2626'; // Rojo
      default:
        return colors.primaryGold;
    }
  };

  // Resumen detallado del DateData (listero)
  const getDetailedDateSummary = (dateData: DateData) => {
    const netProfit = dateData.revenue;
    const ownProfit = -netProfit;
    
    return {
      totalBets: dateData.totalBets,
      validatedBets: dateData.validatedBets,
      nonValidatedBets: dateData.nonValidatedBets,
      totalAmount: dateData.totalAmount,
      initialPool: dateData.totalInicialPool || 0,
      finalPool: dateData.totalEndPool || 0,
      totalProfit: dateData.totalProfit || 0,
      netProfit: dateData.revenue,
      ownProfit,
      bookiePercentAmount: dateData.totalBookiePercentAmount || 0,
      revenueAcumulado: dateData.totalRevenueAcumulado || 0,
      bookieRevenuePercent: dateData.totalBookieRevenuePercent || 0,
    };
  };

  // Estado y color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'WON':
      case 'Approved':
      case 'PAID':
        return '#22c55e';
      case 'LOST':
        return '#ef4444';
      case 'PENDING':
      case 'New':
        return '#f59e0b';
      case 'CANCELLED':
        return '#6b7280';
      case 'ACTIVE':
        return '#3b82f6';
      default:
        return colors.subtleGrey;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'WON':
        return '🏆';
      case 'LOST':
        return '❌';
      case 'PENDING':
        return '⏳';
      case 'Approved':
        return '✅';
      case 'PAID':
        return '💰';
      case 'CANCELLED':
        return '🚫';
      case 'ACTIVE':
        return '🔄';
      case 'New':
        return '🆕';
      default:
        return '❓';
    }
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

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
            disabled={isLoadingData}
          >
            <LinearGradient
              colors={[colors.primaryGold, colors.primaryRed]}
              style={styles.applyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoadingData ? (
                <ActivityIndicator size="small" color={colors.darkBackground} />
              ) : (
                <>
                  <Ionicons name="search-outline" size={20} color={colors.darkBackground} />
                  <Text style={styles.applyButtonText}>Buscar Movimientos</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Resultados */}
        {showHistory && !isLoadingData && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Resultados</Text>
              <View style={styles.historyActions}>
                <TouchableOpacity style={styles.refreshButton} onPress={handleApplyFilters}>
                  <Ionicons name="refresh-outline" size={20} color={colors.primaryGold} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                  <Ionicons name="close-outline" size={20} color={colors.primaryRed} />
                </TouchableOpacity>
              </View>
            </View>

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
                .map((dateData, dateIndex) => {
                  const dateKey = `${dateData.date}-${dateData.bookieUserName}-${dateIndex}`;
                  const isExpanded = expandedDates.has(dateKey);

                  return (
                    <View key={dateKey} style={styles.dateCard}>
                      <TouchableOpacity
                        style={styles.dateHeader}
                        onPress={() => toggleExpandDate(dateKey)}
                      >
                        <View style={styles.dateInfo}>
                          <Text style={styles.dateName}>{dateData.bookieUserName}</Text>
                          <View style={styles.statsInline}>
                            <Text style={styles.statItem}>🎯 Total: {dateData.totalBets}</Text>
                            <Text style={styles.statSeparator}>•</Text>
                            <Text style={styles.statItem}>✅ Validadas: {dateData.validatedBets}</Text>
                            <Text style={styles.statSeparator}>•</Text>
                            <Text style={styles.statItem}>⏳ Pendientes: {dateData.nonValidatedBets}</Text>
                          </View>
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
                          onPress={() => toggleExpandDate(dateKey)}
                        >
                          <Ionicons
                            name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                            size={24}
                            color={colors.primaryGold}
                          />
                        </TouchableOpacity>
                      </View>

                      {isExpanded && (
                        <>
                          {/* Resumen detallado del listero */}
                          <View style={styles.dateDetailedSummary}>
                            <View style={styles.summaryRowMain}>
                              <View style={styles.summaryMainItem}>
                                <Text style={styles.summaryMainValue}>{dateData.totalBets}</Text>
                                <Text style={styles.summaryMainLabel}>APUESTAS</Text>
                              </View>
                              <View style={styles.summaryMainItem}>
                                <Text style={styles.summaryMainValueGold}>${formatAmount(dateData.totalAmount)}</Text>
                                <Text style={styles.summaryMainLabel}>MONTO TOTAL</Text>
                              </View>
                              <View style={styles.summaryMainItem}>
                                <Text style={styles.summaryMainValue}>{dateData.validatedBets}</Text>
                                <Text style={styles.summaryMainLabel}>VALIDADAS</Text>
                              </View>
                            </View>
                            
                            <View style={styles.summaryDetailedGrid}>
                              <View style={styles.summaryDetailedItem}>
                                <Text style={styles.summaryDetailedLabel}>FONDO INICIAL</Text>
                                <Text style={[styles.summaryDetailedValue, styles.poolValueSummary]}>
                                  ${formatAmount(dateData.totalInicialPool)}
                                </Text>
                              </View>
                              <View style={styles.summaryDetailedItem}>
                                <Text style={styles.summaryDetailedLabel}>FONDO FINAL</Text>
                                <Text style={[styles.summaryDetailedValue, styles.poolValueSummary]}>
                                  ${formatAmount(dateData.totalEndPool)}
                                </Text>
                              </View>
                              <View style={styles.summaryDetailedItem}>
                                <Text style={styles.summaryDetailedLabel}>PREMIO TOTAL</Text>
                                <Text style={[styles.summaryDetailedValue, styles.prizeValue]}>
                                  ${formatAmount(dateData.totalProfit)}
                                </Text>
                              </View>
                              <View style={styles.summaryDetailedItem}>
                                <Text style={styles.summaryDetailedLabel}>GANANCIA NETA</Text>
                                <Text
                                  style={[
                                    styles.summaryDetailedValue,
                                    dateData.revenue >= 0 ? styles.profitPositive : styles.profitNegative,
                                  ]}
                                >
                                  ${formatAmount(dateData.revenue)}
                                </Text>
                              </View>
                              <View style={styles.summaryDetailedItem}>
                                <Text style={styles.summaryDetailedLabel}>% LISTERO</Text>
                                <Text style={[styles.summaryDetailedValue, styles.benefitValue]}>
                                  ${formatAmount(dateData.totalBookiePercentAmount)}
                                </Text>
                              </View>
                              <View style={styles.summaryDetailedItem}>
                                <Text style={styles.summaryDetailedLabel}>REVENUE ACUMULADO</Text>
                                <Text style={[styles.summaryDetailedValue, styles.benefitValue]}>
                                  ${formatAmount(dateData.totalRevenueAcumulado)}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Detalle de tiradas */}
                          {dateData.betResumes && (
                            <View style={styles.betResumesList}>
                              <Text style={styles.betResumesTitle}>🎲 Detalle de tiradas:</Text>
                              {dateData.betResumes.map((betResume) => {
                                const hasWinningNumbers = !!(
                                  betResume.throwResult?.centena || 
                                  betResume.throwResult?.corrido1 || 
                                  betResume.throwResult?.corrido2
                                );

                                return (
                              <View key={betResume.id} style={styles.betResumeCard}>
                                {/* Barra de estado superior */}
                                {hasWinningNumbers ? (
                                  <View style={styles.statusBarWinning}>
                                    <View style={styles.statusBarLeft}>
                                      <Ionicons name="trophy" size={16} color="#10b981" />
                                      <Text style={styles.statusBarLabel}>Ganadores</Text>
                                    </View>
                                    <View style={styles.winningNumbersRow}>
                                      {betResume.throwResult?.centena && (
                                        <View style={styles.winningChip}>
                                          <Text style={styles.winningChipText}>{betResume.throwResult.centena}</Text>
                                        </View>
                                      )}
                                      {betResume.throwResult?.corrido1 && (
                                        <View style={styles.winningChip}>
                                          <Text style={styles.winningChipText}>{betResume.throwResult.corrido1}</Text>
                                        </View>
                                      )}
                                      {betResume.throwResult?.corrido2 && (
                                        <View style={styles.winningChip}>
                                          <Text style={styles.winningChipText}>{betResume.throwResult.corrido2}</Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                ) : (
                                  <View style={styles.statusBarNoResults}>
                                    <Ionicons name="time-outline" size={16} color="#fca5a5" />
                                    <Text style={styles.statusBarNoResultsText}>Sin Resultados</Text>
                                  </View>
                                )}

                                <View style={styles.betResumeHeader}>
                                  <View style={styles.betResumeHeaderContent}>
                                    {/* Primera fila: Lotería */}
                                    <View style={styles.headerRow}>
                                      <View style={styles.lotterySection}>
                                        <Ionicons name="game-controller-outline" size={14} color={colors.primaryGold} />
                                        <Text style={styles.betResumeLottery}>
                                          {betResume.lotteryName} - {betResume.throwName}
                                        </Text>
                                      </View>
                                      <View
                                        style={[
                                          styles.completedBadge,
                                          betResume.completed ? styles.statusCompleted : styles.statusPending,
                                        ]}
                                      >
                                        <Text style={styles.completedText}>
                                          {betResume.completed ? '✅' : '⏳'}
                                        </Text>
                                      </View>
                                    </View>

                                    {/* Segunda fila: Fecha */}
                                    <View style={styles.headerRow}>
                                      <Text style={styles.throwDateText}>📅 {formatDate(betResume.date)}</Text>
                                    </View>

                                    {/* Tercera fila: Apuestas */}
                                    <View style={styles.headerRow}>
                                      <Text style={styles.betsInfoText}>
                                        📄 Total: {betResume.betsCount} ({betResume.validatedBetsCount} validadas, {betResume.nonValidatedBetsCount} pendientes)
                                      </Text>
                                    </View>

                                    {/* Cuarta fila: Fondos a la izquierda, Total a la derecha */}
                                    <View style={styles.headerRow}>
                                      <View style={styles.poolsRow}>
                                        <Text style={styles.poolText}>💰 Inicial: ${formatAmount(betResume.inicialPool)}</Text>
                                        <Text style={styles.poolSeparator}>•</Text>
                                        <Text style={styles.poolText}>💎 Final: ${formatAmount(betResume.endPool)}</Text>
                                      </View>
                                      <LinearGradient
                                        colors={[colors.primaryGold, colors.primaryRed]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.totalBadgeCompact}
                                      >
                                        <Text style={styles.totalBadgeText}>${formatAmount(betResume.totalAmount)}</Text>
                                      </LinearGradient>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })
          )}
            </ScrollView>
          </View>
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
  applyButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  applyButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.darkBackground,
  },
  historySection: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  historyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  historyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  refreshButton: {
    padding: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.inputBorder,
  },
  clearButton: {
    padding: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.inputBorder,
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
  statsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  statItem: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  statSeparator: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
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
  statusBadgeIndividual: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusTextIndividual: {
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
    padding: spacing.xs,
  },
  dateDetailedSummary: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primaryGold,
  },
  betResumesList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  betResumesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
    marginBottom: spacing.sm,
  },
  betResumeCard: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    shadowColor: colors.primaryGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  statusBarWinning: {
    backgroundColor: '#047857',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  statusBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusBarLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#d1fae5',
  },
  winningNumbersRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  winningChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  winningChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    color: '#047857',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBarNoResults: {
    backgroundColor: '#dc2626',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: '#ef4444',
  },
  statusBarNoResultsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#fecaca',
  },
  betResumeHeader: {
    padding: spacing.sm,
  },
  betResumeHeaderContent: {
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lotterySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  betResumeLottery: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    fontSize: fontSize.sm,
  },
  throwDateText: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    fontWeight: fontWeight.semibold,
  },
  betsInfoText: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  poolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  poolText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: '#8b5cf6',
  },
  poolSeparator: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  totalBadgeCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    shadowColor: colors.primaryGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  totalBadgeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  summaryRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryGold,
  },
  summaryMainItem: {
    alignItems: 'center',
  },
  summaryMainValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.lightText,
    marginBottom: spacing.xs,
  },
  summaryMainValueGold: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
    marginBottom: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  summaryMainLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.subtleGrey,
    textTransform: 'uppercase',
  },
  summaryDetailedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryDetailedItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.inputBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  summaryDetailedLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.subtleGrey,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  summaryDetailedValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  prizeValue: {
    color: '#3b82f6',
  },
  benefitValue: {
    color: colors.primaryGold,
  },
  poolValueSummary: {
    color: '#8b5cf6',
  },
  profitPositive: {
    color: '#22c55e',
  },
  profitNegative: {
    color: '#ef4444',
  },
});

export default VerMovimientos;
