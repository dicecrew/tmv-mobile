import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import DateRangePicker from '../common/DateRangePicker';
import Toast from 'react-native-toast-message';
import { incomesLogService } from '../../api/services';

interface Transaction {
  id: string;
  bookieId: string;
  bookieName?: string;
  bookieUserName?: string;
  amount: number;
  isDeposit: boolean;
  transactionDate: string;
  poolFinal?: number;
  poolInicial?: number;
  comment?: string;
  createdAt?: string;
  createdBy?: string;
  createdByUserName?: string;
  updatedAt?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [expandedListeros, setExpandedListeros] = useState<{ [key: string]: boolean }>({});

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

  // Procesar datos del reporte
  const processReportData = (data: any) => {
    console.log('📊 processReportData - Datos recibidos:', data);
    
    if (!data) {
      console.log('📊 processReportData - No hay datos');
      return { listeros: [], totals: { totalCollected: 0, totalPaid: 0, netBalance: 0 } };
    }

    let transactions: Transaction[] = [];

    if (Array.isArray(data)) {
      transactions = data;
      console.log('📊 processReportData - Data es array directo');
    } else if (data.data) {
      if (Array.isArray(data.data)) {
        transactions = data.data;
        console.log('📊 processReportData - Data.data es array');
      } else if (typeof data.data === 'object') {
        transactions = Object.values(data.data);
        console.log('📊 processReportData - Data.data es objeto, convertido a array');
      }
    }

    console.log('📊 processReportData - Transacciones extraídas:', transactions.length);

    if (transactions.length === 0) {
      console.log('📊 processReportData - No hay transacciones para procesar');
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

      // Convertir transactionDate de UTC a hora local
      const transactionWithLocalDate = {
        ...transaction,
        transactionDate: transaction.transactionDate
      };

      listerosMap[bookieId].transactions.push(transactionWithLocalDate);

      // isDeposit = true significa PAGO (dinero que sale)
      // isDeposit = false significa RECAUDACIÓN (dinero que entra)
      if (transaction.isDeposit === true) {
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

    console.log('📊 processReportData - Listeros procesados:', listeros.length);
    console.log('📊 processReportData - Total recaudado:', totalCollected);
    console.log('📊 processReportData - Total pagado:', totalPaid);
    console.log('📊 processReportData - Balance neto:', totalCollected - totalPaid);

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
      
      console.log('📊 Reporte - Respuesta completa:', response);
      console.log('📊 Reporte - Respuesta data:', response.data);
      console.log('📊 Reporte - Es array?:', Array.isArray(response.data));
      
      setReportData(response.data || response);
      setShowReport(true);
      
      console.log('📊 Reporte - Datos guardados:', response.data || response);
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

  // Formatear fecha UTC a hora local (misma lógica que versión web)
  const formatDateTime = (dateString: string): string => {
    try {
      const utcDate = new Date(dateString);
      if (isNaN(utcDate.getTime())) {
        return 'Fecha inválida';
      }
      
      // Formatear la fecha con coma separando fecha y hora usando zona horaria local
      const datePart = utcDate.toLocaleDateString();
      const timePart = utcDate.toLocaleTimeString();
      const result = `${datePart}, ${timePart}`;
      return result;
    } catch (error) {
      console.error('❌ Error convirtiendo fecha UTC a local:', dateString, error);
      return 'Fecha inválida';
    }
  };

  const processedData = useMemo(() => {
    const result = processReportData(reportData);
    console.log('📊 useMemo - processedData calculado:', result);
    console.log('📊 useMemo - Tiene listeros?:', result?.listeros?.length || 0);
    console.log('📊 useMemo - Totales:', result?.totals);
    return result;
  }, [reportData]);

  return (
    <View style={styles.container}>
      <Card title="Reporte de Recaudación" icon="bar-chart-outline" style={styles.card}>
        <Text style={styles.description}>
          Genera reportes sobre las recaudaciones realizadas en un rango de fechas específico.
        </Text>

        {/* Filtros de fecha */}
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
          helpText="Selecciona el rango de fechas para generar el reporte de recaudación"
        />

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
        {(() => {
          console.log('📊 Render - showReport:', showReport);
          console.log('📊 Render - isLoading:', isLoading);
          console.log('📊 Render - processedData exists:', !!processedData);
          console.log('📊 Render - Condición cumplida:', showReport && !isLoading && processedData);
          return null;
        })()}
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
                              {transaction.isDeposit ? '💵 Pago' : '💰 Recaudación'}
                            </Text>
                            <Text
                              style={[
                                styles.transactionAmount,
                                transaction.isDeposit
                                  ? styles.amountPaid
                                  : styles.amountCollected,
                              ]}
                            >
                              ${transaction.amount.toLocaleString()}
                            </Text>
                          </View>
                          <Text style={styles.transactionDate}>
                            📅 {formatDateTime(transaction.transactionDate)}
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

    </View>
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
