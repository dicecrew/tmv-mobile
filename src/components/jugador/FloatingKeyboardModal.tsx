import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Portal } from '../../components/common/Portal';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';

const PLAY_TYPE_COLORS: { [key: string]: string } = {
  FIJO: '#2563eb',
  CORRIDO: '#16a34a',
  PARLET: '#dc2626',
  CENTENA: '#7c3aed',
};

interface PlayType {
  id: string;
  name: string;
  code: string;
}

interface Play {
  id: string;
  numbers: string;
  validPlays: any[];
  amount: number;
  timestamp: string;
  typeAmountInputs: { [key: string]: string };
}

interface FloatingKeyboardModalProps {
  isVisible: boolean;
  onToggle: () => void;
  playTypes: PlayType[];
  selectedTypes: string[];
  availableTypes: string[];
  onToggleType: (typeName: string) => void;
  onAddNumber: (num: string) => void;
  onAddComma: () => void;
  onBackspace: () => void;
  onAddDecimalPoint: () => void;
  onApplyAl: () => void;
  onClearAll: () => void;
  onSeparatePlay: () => void;
  onCopyToAll: () => void;
  getIndividualNumbers: () => string[];
  currentNumbers: string;
  allPlays: Play[];
  typeAmountInputs: { [key: string]: string };
  calculateCurrentAmount: () => number;
}

const FloatingKeyboardModal: React.FC<FloatingKeyboardModalProps> = ({
  isVisible,
  onToggle,
  playTypes,
  selectedTypes,
  availableTypes,
  onToggleType,
  onAddNumber,
  onAddComma,
  onBackspace,
  onAddDecimalPoint,
  onApplyAl,
  onClearAll,
  onSeparatePlay,
  onCopyToAll,
  getIndividualNumbers,
  currentNumbers,
  allPlays,
  calculateCurrentAmount,
}) => {
  const screenHeight = Dimensions.get('screen').height;

  return (
    <>
      {/* Botón flotante lateral (overlay absoluto que no bloquea fondo) */}
      <Portal>
        <View style={styles.buttonOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.showModalButton,
              { top: screenHeight * 0.70 },
              isVisible ? { opacity: 0 } : { opacity: 1 }
            ]}
            onPress={onToggle}
            accessibilityLabel="Abrir panel"
            disabled={isVisible}
          >
            <Ionicons name="chevron-back-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </Portal>

      {/* Modal Flotante con Botones (bottom sheet) */}
      {isVisible && (
        <Modal visible transparent presentationStyle="overFullScreen" animationType="none" statusBarTranslucent>
          <View style={styles.sheetOverlay} pointerEvents="box-none">
            {/* Estado local para cerrar con animación antes de desmontar */}
            <SheetWithClose onToggle={onToggle} topOffset={screenHeight * 0.70}>
              {/* Contenido del sheet */}
              <View style={{ flex: 1 }} pointerEvents="auto">
            {/* Botones de Tipos de Juego */}
            <View style={styles.floatingTypesGrid} pointerEvents="auto">
              {playTypes.map(type => {
                const isAvailable = availableTypes.includes(type.name);
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.floatingTypeButton,
                      selectedTypes.includes(type.name) && styles.floatingTypeButtonSelected,
                      selectedTypes.includes(type.name) && {
                        backgroundColor: PLAY_TYPE_COLORS[type.name] || colors.primaryGold,
                        borderColor: PLAY_TYPE_COLORS[type.name] || colors.primaryGold,
                      },
                      !isAvailable && styles.floatingTypeButtonDisabled
                    ]}
                    onPress={() => onToggleType(type.name)}
                    disabled={!isAvailable}
                  >
                    <Text
                      style={[
                        styles.floatingTypeButtonText,
                        selectedTypes.includes(type.name) && styles.floatingTypeButtonTextSelected,
                        !isAvailable && styles.floatingTypeButtonTextDisabled
                      ]}
                    >
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Teclado numérico */}
            <View style={styles.floatingKeyboard} pointerEvents="auto">
              <View style={styles.floatingKeyboardRow}>
                {['7', '8', '9'].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={styles.floatingNumberKey}
                    onPress={() => onAddNumber(num)}
                  >
                    <Text style={styles.floatingNumberKeyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.floatingKeyboardRow}>
                {['4', '5', '6'].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={styles.floatingNumberKey}
                    onPress={() => onAddNumber(num)}
                  >
                    <Text style={styles.floatingNumberKeyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.floatingKeyboardRow}>
                {['1', '2', '3'].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={styles.floatingNumberKey}
                    onPress={() => onAddNumber(num)}
                  >
                    <Text style={styles.floatingNumberKeyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.floatingKeyboardRow}>
                <TouchableOpacity
                  style={styles.floatingNumberKey}
                  onPress={onAddDecimalPoint}
                >
                  <Text style={styles.floatingNumberKeyText}>.</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.floatingNumberKey}
                  onPress={() => onAddNumber('0')}
                >
                  <Text style={styles.floatingNumberKeyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.floatingNumberKey}
                  onPress={onBackspace}
                >
                  <Text style={styles.floatingNumberKeyText}>←</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Botones de acción */}
            <View style={styles.floatingActionButtons} pointerEvents="auto">
              <TouchableOpacity
                style={[styles.floatingActionButton, styles.floatingCopyButton]}
                onPress={onCopyToAll}
                disabled={availableTypes.length === 0}
              >
                <Text style={styles.floatingActionButtonText}>Todos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.floatingActionButton, styles.floatingAlButton]}
                onPress={onApplyAl}
                disabled={getIndividualNumbers().length !== 1}
              >
                <Text style={styles.floatingActionButtonText}>AL</Text>
              </TouchableOpacity>
            
              <TouchableOpacity
                style={[styles.floatingActionButton, styles.floatingEnterButton]}
                onPress={onAddComma}
              >
                <Text style={styles.floatingActionButtonText}>Enter</Text>
              </TouchableOpacity>
            </View>
          
            {/* Botones Eliminar y Separar Jugada */}
            <View style={styles.floatingBottomButtons} pointerEvents="auto">
              <TouchableOpacity
                style={[styles.floatingActionButton, styles.floatingClearButton]}
                onPress={onClearAll}
                disabled={!currentNumbers && allPlays.length === 0}
              >
                <Text style={styles.floatingActionButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            
              <TouchableOpacity
                style={[styles.floatingActionButton, styles.floatingSeparateButton]}
                onPress={onSeparatePlay}
                disabled={!currentNumbers || selectedTypes.length === 0 || calculateCurrentAmount() <= 0}
              >
                <Text style={styles.floatingActionButtonText}>🎯 Separar Jugada</Text>
              </TouchableOpacity>
            </View>

                {/* (opcional: botón interno) */}
              </View>
            </SheetWithClose>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  sheetContent: {
    height: '45%',
    width: '100%',
    backgroundColor: 'transparent',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  floatingTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.darkBackground,
    borderTopWidth: 2,
    borderTopColor: colors.primaryGold,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingTypeButton: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  floatingTypeButtonSelected: {
    borderWidth: 2,
  },
  floatingTypeButtonDisabled: {
    opacity: 0.4,
  },
  floatingTypeButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.lightText,
  },
  floatingTypeButtonTextSelected: {
    color: 'white',
  },
  floatingTypeButtonTextDisabled: {
    color: colors.subtleGrey,
  },
  floatingKeyboard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingKeyboardRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  floatingNumberKey: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  floatingNumberKeyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    color: colors.lightText,
  },
  floatingActionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingBottomButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.darkBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingActionButton: {
    flex: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  floatingCopyButton: {
    backgroundColor: colors.primaryGold,
  },
  floatingAlButton: {
    backgroundColor: colors.primaryGold,
  },
  floatingEnterButton: {
    backgroundColor: colors.primaryGold,
  },
  floatingClearButton: {
    backgroundColor: colors.primaryRed,
  },
  floatingSeparateButton: {
    backgroundColor: '#22c55e',
  },
  floatingActionButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'white',
  },
  floatingToggleButton: {
    position: 'absolute',
    top: -15,
    right: 20,
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    zIndex: 99999,
  },
  showModalButton: {
    position: 'absolute',
    right: 0,
    backgroundColor: colors.primaryGold,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    width: 42,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 20,
    borderWidth: 2,
    borderColor: colors.primaryGold,
  },
  sideToggleButton: {
    position: 'absolute',
    right: 0,
    top: '70%',
    backgroundColor: colors.primaryGold,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    width: 42,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 20,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    zIndex: 1001,
  },
});

export default FloatingKeyboardModal;


// Wrapper que maneja apertura y cierre animados desde la derecha
const SheetWithClose: React.FC<{ onToggle: () => void; topOffset: number; children: React.ReactNode }> = ({ onToggle, topOffset, children }) => {
  const translateX = useRef(new Animated.Value(400)).current;
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Animación de entrada
    Animated.timing(translateX, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRequestClose = () => {
    if (closing) return;
    setClosing(true);
    Animated.timing(translateX, {
      toValue: 400,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onToggle();
      }
    });
  };

  return (
    <>
      {/* Handle lateral para cerrar */}
      <TouchableOpacity style={[styles.sideToggleButton, { top: topOffset }]} onPress={handleRequestClose} accessibilityLabel="Cerrar panel">
        <Ionicons name="chevron-forward-outline" size={22} color="white" />
      </TouchableOpacity>

      <Animated.View style={[styles.sheetContent, { transform: [{ translateX }] }]}> 
        {children}
      </Animated.View>
    </>
  );
};
