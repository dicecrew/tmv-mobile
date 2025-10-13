import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { bookieService, incomesLogService } from '../../api/services';

interface Listero {
  id: string;
  belongToUserId: string;
  name: string;
  pendingAmount: number;
  lastCollection: string;
  totalCollected: number;
  status: 'active' | 'up_to_date';
}

const RegistrarRecaudacion: React.FC = () => {
  const [listeros, setListeros] = useState<Listero[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedListero, setSelectedListero] = useState<Listero | null>(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [actionType, setActionType] = useState<'collect' | 'pay'>('collect');

  // Cargar listeros
  const loadListeros = async () => {
    setIsLoading(true);
    try {
      const response = await bookieService.getBookies();
      
      let bookiesArray: any[] = [];
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        bookiesArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        bookiesArray = response.data;
      }
      
      const mappedListeros: Listero[] = bookiesArray.map((bookie) => ({
        id: bookie.id,
        belongToUserId: bookie.belongToUserId,
        name: bookie.belongToUserName || `${bookie.firstName || ''} ${bookie.lastName || ''}`.trim(),
        pendingAmount: bookie.pool || 0,
        lastCollection: bookie.lastCollection || new Date().toISOString().split('T')[0],
        totalCollected: bookie.totalCollected || 0,
        status: (bookie.pool || 0) > 0 ? 'active' : 'up_to_date',
      }));
      
      setListeros(mappedListeros);
    } catch (error) {
      console.error('Error loading listeros:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los listeros',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListeros();
  }, []);

  // Totales
  const totalPendingAmount = useMemo(() => {
    return listeros.reduce((total, listero) => total + listero.pendingAmount, 0);
  }, [listeros]);

  const activeListeros = useMemo(() => {
    return listeros.filter((listero) => listero.pendingAmount > 0).length;
  }, [listeros]);

  // Manejar recaudar dinero
  const handleCollectMoney = (listero: Listero) => {
    setSelectedListero(listero);
    setCollectionAmount(listero.pendingAmount.toString());
    setActionType('collect');
    setShowCollectionModal(true);
  };

  // Manejar pagar dinero
  const handlePayMoney = (listero: Listero) => {
    setSelectedListero(listero);
    setCollectionAmount('');
    setActionType('pay');
    setShowCollectionModal(true);
  };

  // Confirmar operación
  const handleConfirmCollection = async () => {
    if (!selectedListero || !collectionAmount) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor, verifique los datos de la operación',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const amount = parseFloat(collectionAmount);
    if (amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El monto debe ser mayor a 0',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (actionType === 'collect' && amount > selectedListero.pendingAmount) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `El monto no puede exceder $${selectedListero.pendingAmount.toLocaleString()}`,
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    setLoading(true);
    try {
      const incomeData = {
        date: new Date().toISOString(),
        bookieId: selectedListero.id,
        amount: amount,
        isDeposit: actionType === 'pay',
        comment: collectionNotes || `${actionType === 'pay' ? 'Pago' : 'Recaudación'} a ${selectedListero.name}`,
      };

      await incomesLogService.incomeRegister(incomeData);

      const actionText = actionType === 'collect' ? 'Recaudación' : 'Pago';
      Toast.show({
        type: 'success',
        text1: '¡Éxito!',
        text2: `${actionText} registrada - Listero: ${selectedListero.name} - Monto: $${amount.toLocaleString()}`,
        position: 'top',
        topOffset: 60,
        visibilityTime: 5000,
      });

      setShowCollectionModal(false);
      setSelectedListero(null);
      setCollectionAmount('');
      setCollectionNotes('');
      setActionType('collect');
      
      loadListeros();
    } catch (error: any) {
      const actionText = actionType === 'collect' ? 'recaudación' : 'pago';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || `Error al registrar la ${actionText}`,
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card title="Registrar Recaudaciones de Listeros" icon="cash-outline" style={styles.card}>
        <Text style={styles.description}>
          Gestiona las recaudaciones de tus listeros. Registra los montos recolectados y actualiza sus saldos pendientes.
        </Text>

        {/* Resumen */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="wallet-outline" size={20} color={colors.primaryGold} />
            <Text style={styles.summaryLabel}>Total Pendiente</Text>
            <Text style={styles.summaryValue}>${totalPendingAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="people-outline" size={20} color={colors.primaryGold} />
            <Text style={styles.summaryLabel}>Listeros Activos</Text>
            <Text style={styles.summaryValue}>
              {activeListeros} de {listeros.length}
            </Text>
          </View>
        </View>

        {/* Estados de carga */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGold} />
            <Text style={styles.loadingText}>Cargando listeros...</Text>
          </View>
        )}

        {!isLoading && listeros.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.subtleGrey} />
            <Text style={styles.emptyText}>No hay listeros disponibles</Text>
          </View>
        )}

        {/* Lista de listeros */}
        <ScrollView style={styles.listerosList}>
          {listeros.map((listero) => (
            <View
              key={listero.id}
              style={[
                styles.listeroItem,
                listero.status === 'up_to_date' && styles.listeroItemUpToDate,
              ]}
            >
              <View style={styles.listeroHeader}>
                <View style={styles.listeroInfo}>
                  <View style={styles.listeroNameRow}>
                    <Text style={styles.listeroName}>{listero.name}</Text>
                    {listero.status === 'up_to_date' && (
                      <View style={styles.badgeUpToDate}>
                        <Text style={styles.badgeText}>AL DÍA</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.listeroAmountContainer}>
                  <Text
                    style={[
                      styles.listeroAmount,
                      listero.pendingAmount > 0 ? styles.amountPending : styles.amountUpToDate,
                    ]}
                  >
                    ${listero.pendingAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={styles.listeroActions}>
                {listero.pendingAmount > 0 && (
                  <TouchableOpacity
                    style={styles.collectButton}
                    onPress={() => handleCollectMoney(listero)}
                  >
                    <LinearGradient
                      colors={[colors.primaryGold, colors.primaryRed]}
                      style={styles.actionButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="wallet-outline" size={14} color={colors.darkBackground} />
                      <Text style={styles.collectButtonText}>Recaudar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => handlePayMoney(listero)}
                >
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="cash-outline" size={14} color="white" />
                    <Text style={styles.payButtonText}>Pagar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.warningBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primaryGold} />
          <Text style={styles.warningText}>
            Las recaudaciones se registran inmediatamente y actualizan los saldos pendientes de cada listero.
          </Text>
        </View>
      </Card>

      {/* Modal de Registro */}
      <Modal
        visible={showCollectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCollectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowCollectionModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'collect' ? 'Registrar Recaudación' : 'Registrar Pago'}
              </Text>
              <TouchableOpacity onPress={() => setShowCollectionModal(false)}>
                <Ionicons name="close-outline" size={28} color={colors.subtleGrey} />
              </TouchableOpacity>
            </View>

            {selectedListero && (
              <ScrollView>
                <Text style={styles.modalDescription}>
                  {actionType === 'collect'
                    ? `Registra el monto recolectado del listero `
                    : `Registra el monto pagado al listero `}
                  <Text style={styles.modalDescriptionBold}>{selectedListero.name}</Text>
                </Text>

                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nombre:</Text>
                    <Text style={styles.infoValue}>{selectedListero.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Saldo Pendiente:</Text>
                    <Text style={styles.infoValue}>${selectedListero.pendingAmount.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    <Ionicons name="cash-outline" size={16} color={colors.lightText} />{' '}
                    {actionType === 'collect' ? 'Monto a Recaudar ($)' : 'Monto a Pagar ($)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={actionType === 'collect' ? 'Ingrese el monto recolectado' : 'Ingrese el monto a pagar'}
                    placeholderTextColor={colors.subtleGrey}
                    value={collectionAmount}
                    onChangeText={setCollectionAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    <Ionicons name="document-text-outline" size={16} color={colors.lightText} /> Notas (Opcional)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Observaciones sobre la recaudación"
                    placeholderTextColor={colors.subtleGrey}
                    value={collectionNotes}
                    onChangeText={setCollectionNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {collectionAmount && parseFloat(collectionAmount) > 0 && (
                  <View style={styles.resultBox}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#22c55e" />
                    <Text style={styles.resultText}>
                      {actionType === 'collect'
                        ? `Saldo restante después de la recaudación: $${(
                            selectedListero.pendingAmount - parseFloat(collectionAmount)
                          ).toLocaleString()}`
                        : `Saldo después del pago: $${(
                            selectedListero.pendingAmount + parseFloat(collectionAmount)
                          ).toLocaleString()}`}
                    </Text>
                  </View>
                )}

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowCollectionModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmCollection}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#22c55e', '#16a34a']}
                      style={styles.confirmButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                          <Text style={styles.confirmButtonText}>
                            {actionType === 'collect' ? 'Confirmar Recaudación' : 'Confirmar Pago'}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.primaryGold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.subtleGrey,
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
  listerosList: {
    flex: 1,
  },
  listeroItem: {
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryGold,
    marginBottom: spacing.md,
  },
  listeroItemUpToDate: {
    opacity: 0.7,
    backgroundColor: colors.darkBackground,
    borderLeftColor: '#22c55e',
  },
  listeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  listeroInfo: {
    flex: 1,
  },
  listeroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listeroName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  badgeUpToDate: {
    backgroundColor: '#22c55e',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  listeroAmountContainer: {
    alignItems: 'flex-end',
  },
  listeroAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  amountPending: {
    color: colors.primaryGold,
  },
  amountUpToDate: {
    color: '#22c55e',
  },
  listeroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  collectButton: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  payButton: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  collectButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.darkBackground,
  },
  payButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: 'white',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primaryGold}1A`,
    borderWidth: 2,
    borderColor: `${colors.primaryGold}33`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primaryGold,
    lineHeight: 18,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.inputBackground,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  modalDescription: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginBottom: spacing.lg,
  },
  modalDescriptionBold: {
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  infoBox: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryGold,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
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
  input: {
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.lightText,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  resultText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: '#22c55e',
    fontWeight: fontWeight.semibold,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.subtleGrey,
  },
  confirmButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  confirmButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
});

export default RegistrarRecaudacion;
