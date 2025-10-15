import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';
import Card from '../common/Card';
import Combobox, { ComboboxOption } from '../common/Combobox';
import Toast from 'react-native-toast-message';
import { throwService, betResumeService } from '../../api/services';

interface Throw {
  id: string;
  name: string;
  lotteryName: string;
  startTime: string | null;
  endTime: string | null;
}

const CerrarTiradas: React.FC = () => {
  const [validThrows, setValidThrows] = useState<Throw[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedThrowId, setSelectedThrowId] = useState('');

  // Cargar tiradas válidas
  const loadValidThrows = async () => {
    setIsLoading(true);
    try {
      const response = await throwService.getValidThrows();
      
      let throwsArray: any[] = [];
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        throwsArray = Object.values(response.data);
      } else if (Array.isArray(response.data)) {
        throwsArray = response.data;
      }
      
      setValidThrows(throwsArray);
    } catch (error) {
      console.error('Error loading valid throws:', error);
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
    loadValidThrows();
  }, []);

  // Convertir throws a opciones del combobox
  const throwOptions: ComboboxOption[] = validThrows.map(throwItem => ({
    id: throwItem.id,
    label: `${throwItem.lotteryName?.toUpperCase()} - ${throwItem.name}`,
    value: throwItem.id,
  }));

  // Cerrar tirada
  const handleCloseDraw = () => {
    if (!selectedThrowId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor, seleccione una tirada',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const selectedThrow = validThrows.find((t) => t.id === selectedThrowId);
    if (!selectedThrow) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se encontró la tirada seleccionada',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    Alert.alert(
      '🔒 Cerrar Tirada',
      `¿Estás seguro de que quieres cerrar la tirada?\n\n${selectedThrow.lotteryName} - ${selectedThrow.name}\n\nEsta acción impide que se registren más jugadas para esta tirada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Tirada',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await betResumeService.closeThrow(selectedThrowId);

              Toast.show({
                type: 'success',
                text1: '¡Éxito!',
                text2: `Tirada ${selectedThrow.lotteryName} - ${selectedThrow.name} cerrada`,
                position: 'top',
                topOffset: 60,
                visibilityTime: 5000,
              });

              setSelectedThrowId('');
              loadValidThrows();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo cerrar la tirada',
                position: 'top',
                topOffset: 60,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card title="Cerrar Tiradas Manualmente" icon="lock-closed-outline" style={styles.card}>
        <Text style={styles.description}>
          Esta acción impide que se registren más jugadas para la tirada seleccionada, cerrando la posibilidad de nuevas apuestas.
        </Text>

        <View style={styles.formGroup}>
          <Combobox
            options={throwOptions}
            selectedValue={selectedThrowId}
            onValueChange={setSelectedThrowId}
            placeholder="-- Seleccione una tirada --"
            loading={isLoading}
            loadingText="Cargando tiradas..."
            emptyText="⚠️ No hay tiradas disponibles"
            enabled={!isLoading}
            label="Seleccionar Tirada *"
            icon="megaphone-outline"
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCloseDraw}
          disabled={loading || isLoading || !selectedThrowId}
        >
          <LinearGradient
            colors={[colors.primaryRed, '#8B0000']}
            style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={20} color="white" />
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Cargando...' : 'Cerrar Tirada'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.subtleGrey,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  submitButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
});

export default CerrarTiradas;
