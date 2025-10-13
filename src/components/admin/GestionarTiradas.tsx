import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Toast from 'react-native-toast-message';
import { throwService } from '../../api/services';

interface Tirada {
  id: string;
  lotteryName: string;
  throwName: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  icon: string;
}

const GestionarTiradas: React.FC = () => {
  const [tiradas, setTiradas] = useState<Tirada[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTiradaData, setEditTiradaData] = useState<Tirada | null>(null);
  
  // Time pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Función para obtener el ícono de la lotería
  const getLotteryIcon = (lotteryName: string): string => {
    const name = lotteryName?.toLowerCase() || '';
    if (name.includes('florida')) return '🌴';
    if (name.includes('new york') || name.includes('newyork')) return '🗽';
    if (name.includes('georgia')) return '🍑';
    return '🎰'; // Ícono por defecto
  };

  // Cargar tiradas
  const loadTiradas = async () => {
    setIsLoading(true);
    try {
      const response = await throwService.getThrows();
      
      let throwsArray: any[] = [];
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        throwsArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        throwsArray = response.data;
      }
      
      const mappedTiradas: Tirada[] = throwsArray.map((throwItem) => ({
        id: throwItem.id,
        lotteryName: throwItem.lotteryName || 'N/A',
        throwName: throwItem.name || throwItem.throwName || 'N/A',
        startTime: throwItem.startTime || null,
        endTime: throwItem.endTime || null,
        status: throwItem.status || 'active',
        icon: getLotteryIcon(throwItem.lotteryName),
      }));
      
      // Ordenar por nombre de lotería
      const sortedTiradas = mappedTiradas.sort((a, b) => {
        const nameA = a.lotteryName.toLowerCase();
        const nameB = b.lotteryName.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setTiradas(sortedTiradas);
    } catch (error) {
      console.error('Error loading tiradas:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar las tiradas',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTiradas();
  }, []);

  // Convertir UTC string a Date local
  const parseUTCTime = (utcString: string | null): Date => {
    if (!utcString) return new Date();
    try {
      return new Date(utcString);
    } catch (error) {
      return new Date();
    }
  };

  // Convertir Date local a hora UTC en formato HH:mm
  const dateToUTCTime = (date: Date): string => {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Editar tirada
  const handleEditTirada = (tirada: Tirada) => {
    setEditTiradaData(tirada);
    setStartTime(parseUTCTime(tirada.startTime));
    setEndTime(parseUTCTime(tirada.endTime));
    setShowEditModal(true);
  };

  // Manejar cambio de hora de inicio
  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShowStartTimePicker(false);
      return;
    }
    if (selectedDate) {
      setStartTime(selectedDate);
      if (Platform.OS === 'android') {
        setShowStartTimePicker(false);
      }
    }
  };

  // Manejar cambio de hora de fin
  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      setShowEndTimePicker(false);
      return;
    }
    if (selectedDate) {
      setEndTime(selectedDate);
      if (Platform.OS === 'android') {
        setShowEndTimePicker(false);
      }
    }
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    if (!editTiradaData) return;

    const startTimeUTC = dateToUTCTime(startTime);
    const endTimeUTC = dateToUTCTime(endTime);

    setLoading(true);
    try {
      // Usar el endpoint especial de actualización de tiempos
      const response = await fetch(
        `https://api.themoneyvice.com/api/Admin/throw/${editTiradaData.id}/update-times/${startTimeUTC}/${endTimeUTC}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar tirada');
      }

      Toast.show({
        type: 'success',
        text1: '¡Éxito!',
        text2: `Tirada ${editTiradaData.lotteryName} - ${editTiradaData.throwName} actualizada`,
        position: 'top',
        topOffset: 60,
        visibilityTime: 5000,
      });

      setShowEditModal(false);
      setEditTiradaData(null);
      loadTiradas();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo actualizar la tirada',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar tirada
  const handleDeleteTirada = (tirada: Tirada) => {
    Alert.alert(
      '🗑️ Eliminar Tirada',
      `¿Estás seguro de que quieres eliminar esta tirada?\n\n${tirada.lotteryName} - ${tirada.throwName}\n\n⚠️ Esta acción es irreversible`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await throwService.deleteThrow(tirada.id);
              
              Toast.show({
                type: 'success',
                text1: '¡Éxito!',
                text2: `Tirada ${tirada.lotteryName} - ${tirada.throwName} eliminada`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });
              
              loadTiradas();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo eliminar la tirada',
                position: 'top',
                topOffset: 60,
              });
            }
          },
        },
      ]
    );
  };

  // Formatear hora para mostrar
  const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <View style={styles.container}>
      <Card title="Gestionar Tiradas" icon="time-outline" style={styles.card}>
        <Text style={styles.description}>
          Visualiza, edita y elimina las tiradas registradas en el sistema.
        </Text>

        {/* Estados de carga y error */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGold} />
            <Text style={styles.loadingText}>Cargando tiradas...</Text>
          </View>
        )}

        {!isLoading && tiradas.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.subtleGrey} />
            <Text style={styles.emptyText}>No hay tiradas registradas</Text>
          </View>
        )}

        {/* Lista de tiradas */}
        <ScrollView style={styles.tiradasList}>
          {tiradas.map((tirada) => (
            <View key={tirada.id} style={styles.tiradaItem}>
              <View style={styles.tiradaHeader}>
                <Text style={styles.tiradaIcon}>{tirada.icon}</Text>
                <View style={styles.tiradaInfo}>
                  <Text style={styles.tiradaName}>
                    {tirada.lotteryName} - {tirada.throwName}
                  </Text>
                  <Text style={styles.tiradaDetail}>
                    🕐 Inicio: {formatTime(tirada.startTime)}
                  </Text>
                  <Text style={styles.tiradaDetail}>
                    🕐 Fin: {formatTime(tirada.endTime)}
                  </Text>
                </View>
              </View>
              <View style={styles.tiradaActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditTirada(tirada)}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.darkBackground} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTirada(tirada)}
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </Card>

      {/* Modal Editar */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowEditModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                {editTiradaData && (
                  <>
                    <Text style={styles.modalIcon}>{editTiradaData.icon}</Text>
                    <Text style={styles.modalTitle}>Editar Tirada</Text>
                  </>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close-outline" size={28} color={colors.subtleGrey} />
              </TouchableOpacity>
            </View>

            {editTiradaData && (
              <ScrollView>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Lotería</Text>
                  <Text style={styles.disabledText}>{editTiradaData.lotteryName}</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nombre de Tirada</Text>
                  <Text style={styles.disabledText}>{editTiradaData.throwName}</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Hora de Inicio</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.primaryGold} />
                    <Text style={styles.timeButtonText}>
                      {startTime.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.helperText}>
                    Fecha: {startTime.toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Hora de Fin</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.primaryGold} />
                    <Text style={styles.timeButtonText}>
                      {endTime.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.helperText}>
                    Fecha: {endTime.toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveEdit}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#22c55e', '#16a34a']}
                      style={styles.saveButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleEndTimeChange}
        />
      )}
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
  tiradasList: {
    flex: 1,
  },
  tiradaItem: {
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
    marginBottom: spacing.md,
  },
  tiradaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tiradaIcon: {
    fontSize: 32,
  },
  tiradaInfo: {
    flex: 1,
  },
  tiradaName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  tiradaDetail: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
  },
  tiradaActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryGold,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.darkBackground,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryRed,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  deleteButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: 'white',
  },
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalIcon: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: fontSize.xl,
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
  disabledText: {
    fontSize: fontSize.md,
    color: colors.subtleGrey,
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.darkBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
  },
  timeButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.subtleGrey,
    marginTop: spacing.xs,
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
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
});

export default GestionarTiradas;
