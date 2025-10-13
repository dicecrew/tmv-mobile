import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { incomesLogService } from '../../api/services';

interface Transaction {
  id: string;
  bookieId: string;
  bookieName: string;
  bookieUserName?: string;
  amount: number;
  isDeposit: boolean;
  type: string;
  date: string;
  poolFinal?: number;
  comment?: string;
}

interface ListeroReport {
  bookieId: string;
  bookieName: string;
  transactions: Transaction[];
  totalCollected: number;
  totalPaid: number;
  poolFinal: number;
}

const ReporteRecaudacion: React.FC = () => {
  const getCurrentLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [expandedListeros, setExpandedListeros] = useState<{ [key: string]: boolean }>({});

  // Manejar cambio de fecha desde
  const handleDateFromChange = (event: any, selectedDate?: Date) => {
    setShowDateFromPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShowDateFromPicker(false);
      return;
    }
    if (selectedDate) {
      setDateFrom(selectedDate);
      if (Platform.OS === 'android') {
        setShowDateFromPicker(false);
      }
    }
  };

  // Manejar cambio de fecha hasta
  const handleDateToChange = (event: any, selectedDate?: Date) => {
    setShowDateToPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShowDateToPicker(false);
      return;
    }
    if (selectedDate) {
      setDateTo(selectedDate);
      if (Platform.OS === 'android') {
        setShowDateToPicker(false);
      }
    }
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

  // Procesar datos del reporte
  const processReportData = (data: any) => {
    if (!data) {
      return { listeros: [], totals: { totalCollected: 0, totalPaid: 0, netBalance: 0 } };
    }

    let transactions: Transaction[] = [];

    if (Array.isArray(data)) {
      transactions = data;
    } else if (data.data) {
      if (Array.isArray(data.data)) {
        transactions = data.data;
      } else if (typeof data.data === 'object') {
        transactions = Object.values(data.data);
      }
    }

    if (transactions.length === 0) {
      return { listeros: [], totals: { totalCollected: 0, totalPaid: 0, netBalance: 0 } };
    }

    // Agrupar por listero
    const listerosMap: { [key: string]: ListeroReport } = {};
    let totalCollected = 0;
    let totalPaid = 0;

    transactions.forEach((transaction) => {
      const bookieId = transaction.bookieId;
      const bookieName = transaction.bookieUserName || transaction.bookieName || 'Listero sin nombre';

      if (!listerosMap[bookieId]) {
        listerosMap[bookieId] = {
          bookieId,
          bookieName,
          transactions: [],
          totalCollected: 0,
          totalPaid: 0,
          poolFinal: 0,
        };
      }

      listerosMap[bookieId].transactions.push(transaction);

      if (transaction.type === 'Paid' || transaction.isDeposit) {
        listerosMap[bookieId].totalPaid += transaction.amount || 0;
        totalPaid += transaction.amount || 0;
      } else {
        listerosMap[bookieId].totalCollected += transaction.amount || 0;
        totalCollected += transaction.amount || 0;
      }

      if (transaction.poolFinal !== undefined) {
        listerosMap[bookieId].poolFinal = transaction.poolFinal;
      }
    });

    const listeros = Object.values(listerosMap);

    return {
      listeros,
      totals: {
        totalCollected,
        totalPaid,
        netBalance: totalCollected - totalPaid,
      },
    };
  };

  // Generar reporte
  const handleGenerateReport = async () => {
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

    setIsLoading(true);
    try {
      const params = {
        from: convertLocalDateToUTC(dateFrom, false),
        to: convertLocalDateToUTC(dateTo, true),
      };

      const response = await incomesLogService.getIncomesLogDateRange(params);
      setReportData(response.data || response);
      setShowReport(true);
    } catch (error) {
      console.error('Error loading report:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo generar el reporte',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar expansión de listero
  const toggleListeroExpansion = (listeroId: string) => {
    setExpandedListeros((prev) => ({
      ...prev,
      [listeroId]: !prev[listeroId],
    }));
  };

  // Formatear fecha
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const processedData = useMemo(() => processReportData(reportData), [reportData]);

  return (
    <View style={styles.container}>
      <Card title="Reporte de Recaudación" icon="bar-chart-outline" style={styles.card}>
        <Text style={styles.description}>
          Genera reportes sobre las recaudaciones realizadas en un rango de fechas específico.
        </Text>

        {/* Filtros de fecha */}
        <View style={styles.dateFilters}>
          <View style={styles.dateFilterItem}>
            <Text style={styles.dateLabel}>📅 Desde:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateFromPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {dateFrom.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={colors.primaryGold} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateFilterItem}>
            <Text style={styles.dateLabel}>📅 Hasta:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateToPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {dateTo.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={colors.primaryGold} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateReport}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.generateButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.generateButtonText}>CARGANDO...</Text>
              </>
            ) : (
              <>
                <Ionicons name="search-outline" size={24} color="white" />
                <Text style={styles.generateButtonText}>GENERAR REPORTE</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resultados */}
        {showReport && !isLoading && processedData && (
          <ScrollView style={styles.reportResults}>
            {/* Resumen General */}
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>📊 Resumen General</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Recaudado</Text>
                  <Text style={[styles.summaryValue, styles.summaryValuePositive]}>
                    ${processedData.totals.totalCollected.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Pagado</Text>
                  <Text style={[styles.summaryValue, styles.summaryValueNegative]}>
                    ${processedData.totals.totalPaid.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Balance Neto</Text>
                  <Text style={[styles.summaryValue, styles.summaryValueGold]}>
                    ${processedData.totals.netBalance.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Listeros */}
            {processedData.listeros.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="information-circle-outline" size={48} color={colors.subtleGrey} />
                <Text style={styles.emptyText}>
                  No hay transacciones en el rango de fechas seleccionado
                </Text>
              </View>
            ) : (
              processedData.listeros.map((listero: ListeroReport) => (
                <View key={listero.bookieId} style={styles.listeroCard}>
                  <TouchableOpacity
                    style={styles.listeroHeader}
                    onPress={() => toggleListeroExpansion(listero.bookieId)}
                  >
                    <View style={styles.listeroInfo}>
                      <Text style={styles.listeroName}>{listero.bookieName}</Text>
                      <Text style={styles.listeroStats}>
                        Recaudado: ${listero.totalCollected.toLocaleString()} | Pagado: ${listero.totalPaid.toLocaleString()}
                      </Text>
                    </View>
                    <Ionicons
                      name={expandedListeros[listero.bookieId] ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={colors.primaryGold}
                    />
                  </TouchableOpacity>

                  {expandedListeros[listero.bookieId] && (
                    <View style={styles.transactionsList}>
                      {listero.transactions.map((transaction, index) => (
                        <View key={index} style={styles.transactionItem}>
                          <View style={styles.transactionHeader}>
                            <Text style={styles.transactionType}>
                              {transaction.isDeposit || transaction.type === 'Paid' ? '💵 Pago' : '💰 Recaudación'}
                            </Text>
                            <Text
                              style={[
                                styles.transactionAmount,
                                transaction.isDeposit || transaction.type === 'Paid'
                                  ? styles.amountPaid
                                  : styles.amountCollected,
                              ]}
                            >
                              ${transaction.amount.toLocaleString()}
                            </Text>
                          </View>
                          <Text style={styles.transactionDate}>
                            📅 {formatDateTime(transaction.date)}
                          </Text>
                          {transaction.comment && (
                            <Text style={styles.transactionComment}>💬 {transaction.comment}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </Card>

      {/* Date Pickers */}
      {showDateFromPicker && (
        <DateTimePicker
          value={dateFrom}
          mode="date"
          display="default"
          onChange={handleDateFromChange}
          maximumDate={new Date()}
        />
      )}

      {showDateToPicker && (
        <DateTimePicker
          value={dateTo}
          mode="date"
          display="default"
          onChange={handleDateToChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
  } catch (error) {
    return 'Fecha inválida';
  }
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
  dateFilters: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dateFilterItem: {
    marginBottom: spacing.md,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryGold,
    marginBottom: spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  dateButtonText: {
    fontSize: fontSize.md,
    color: colors.lightText,
  },
  generateButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  generateButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  reportResults: {
    marginTop: spacing.lg,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
    marginBottom: spacing.md,
  },
  summaryGrid: {
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: `${colors.primaryGold}33`,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
  },
  summaryValuePositive: {
    color: '#22c55e',
  },
  summaryValueNegative: {
    color: colors.primaryRed,
  },
  summaryValueGold: {
    color: colors.primaryGold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.subtleGrey,
    textAlign: 'center',
  },
  listeroCard: {
    backgroundColor: colors.darkBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  listeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
  },
  listeroInfo: {
    flex: 1,
  },
  listeroName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  listeroStats: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  transactionsList: {
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
  },
  transactionItem: {
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  transactionType: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  amountCollected: {
    color: '#22c55e',
  },
  amountPaid: {
    color: colors.primaryRed,
  },
  transactionDate: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
  },
  transactionComment: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});

export default ReporteRecaudacion;
