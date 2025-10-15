import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/GlobalStyles';

export interface ComboboxOption {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  selectedValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  enabled?: boolean;
  disabled?: boolean;
  style?: any;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  maxHeight?: number;
}

const Combobox: React.FC<ComboboxProps> = ({
  options = [],
  selectedValue = '',
  onValueChange,
  placeholder = 'Seleccionar...',
  loading = false,
  loadingText = 'Cargando...',
  emptyText = 'No hay opciones disponibles',
  enabled = true,
  disabled = false,
  style,
  label,
  icon,
  maxHeight = 300,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getSelectedOption = () => {
    return options.find(option => option.value === selectedValue);
  };

  const handleOptionSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  const renderOption = ({ item }: { item: ComboboxOption }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedValue === item.value && styles.optionItemSelected,
        item.disabled && styles.optionItemDisabled
      ]}
      onPress={() => !item.disabled && handleOptionSelect(item.value)}
      disabled={item.disabled}
    >
      <View style={styles.optionItemContent}>
        <Text style={[
          styles.optionItemText,
          selectedValue === item.value && styles.optionItemTextSelected,
          item.disabled && styles.optionItemTextDisabled
        ]}>
          {item.label}
        </Text>
        {selectedValue === item.value && !item.disabled && (
          <Ionicons name="checkmark" size={16} color={colors.primaryGold} />
        )}
      </View>
    </TouchableOpacity>
  );

  const getDisplayText = () => {
    if (loading) return loadingText;
    if (options.length === 0) return emptyText;
    if (selectedValue) return getSelectedOption()?.label || placeholder;
    return placeholder;
  };

  const isDisabled = disabled || loading || options.length === 0;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {icon && <Ionicons name={icon} size={16} color={colors.lightText} />}
          {icon && ' '}
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.comboboxContainer,
          enabled && !isDisabled && styles.comboboxEnabled,
          isDisabled && styles.comboboxDisabled
        ]}
        onPress={() => {
          if (!isDisabled) {
            setIsOpen(true);
          }
        }}
        disabled={isDisabled}
      >
        <View style={styles.comboboxContent}>
          <Text style={[
            styles.comboboxText,
            !selectedValue && styles.comboboxPlaceholder,
            isDisabled && styles.comboboxTextDisabled
          ]}>
            {getDisplayText()}
          </Text>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={isDisabled ? colors.subtleGrey : colors.primaryGold} 
          />
        </View>
      </TouchableOpacity>

      {/* Modal del combobox */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.dropdown, { maxHeight: maxHeight + 80 }]}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>
                {label || 'Seleccionar opción'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.lightText} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.id}
              style={[styles.optionsList, { maxHeight }]}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.lightText,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  comboboxContainer: {
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    minHeight: 50,
  },
  comboboxEnabled: {
    borderColor: colors.primaryGold,
  },
  comboboxDisabled: {
    opacity: 0.6,
    borderColor: colors.inputBorder,
  },
  comboboxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
  },
  comboboxText: {
    fontSize: fontSize.md,
    color: colors.lightText,
    flex: 1,
    fontWeight: fontWeight.medium,
  },
  comboboxPlaceholder: {
    color: colors.subtleGrey,
    fontStyle: 'italic',
  },
  comboboxTextDisabled: {
    color: colors.subtleGrey,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dropdown: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    width: '100%',
    maxWidth: 400,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  dropdownTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryGold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  optionItemSelected: {
    backgroundColor: `${colors.primaryGold}20`,
  },
  optionItemDisabled: {
    opacity: 0.5,
  },
  optionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionItemText: {
    fontSize: fontSize.sm,
    color: colors.lightText,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  optionItemTextSelected: {
    color: colors.primaryGold,
    fontWeight: fontWeight.bold,
  },
  optionItemTextDisabled: {
    color: colors.subtleGrey,
  },
});

export default Combobox;
