import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTimelineTheme } from '../context/TimelineThemeContext';

const TimelineSettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, updateTheme, resetTheme } = useTimelineTheme();
  const [localTheme, setLocalTheme] = useState(theme);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handleSave = async () => {
    try {
      await updateTheme(localTheme);
      Alert.alert('Success', 'Theme saved successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save theme');
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Theme',
      'Are you sure you want to reset to default theme?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetTheme();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const updateColor = (category, type, color) => {
    setLocalTheme(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: color,
      },
    }));
  };

  const updateFontSize = (type, size) => {
    setLocalTheme(prev => ({
      ...prev,
      fontSizes: {
        ...prev.fontSizes,
        [type]: parseInt(size) || prev.fontSizes[type],
      },
    }));
  };

  const updateSpacing = (type, value) => {
    setLocalTheme(prev => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        [type]: parseInt(value) || prev.spacing[type],
      },
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Colors</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Timeline Line Color</Text>
          <View style={styles.colorInputRow}>
            <TextInput
              style={styles.colorInput}
              value={localTheme.lineColor}
              onChangeText={(color) => setLocalTheme(prev => ({ ...prev, lineColor: color }))}
              placeholder="#007AFF"
            />
            <View style={[styles.colorPreview, { backgroundColor: localTheme.lineColor }]} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Era Color</Text>
          <View style={styles.colorInputRow}>
            <TextInput
              style={styles.colorInput}
              value={localTheme.itemColors.era}
              onChangeText={(color) => updateColor('itemColors', 'era', color)}
              placeholder="#4A90E2"
            />
            <View style={[styles.colorPreview, { backgroundColor: localTheme.itemColors.era }]} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Event Color</Text>
          <View style={styles.colorInputRow}>
            <TextInput
              style={styles.colorInput}
              value={localTheme.itemColors.event}
              onChangeText={(color) => updateColor('itemColors', 'event', color)}
              placeholder="#50C878"
            />
            <View style={[styles.colorPreview, { backgroundColor: localTheme.itemColors.event }]} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Scene Color</Text>
          <View style={styles.colorInputRow}>
            <TextInput
              style={styles.colorInput}
              value={localTheme.itemColors.scene}
              onChangeText={(color) => updateColor('itemColors', 'scene', color)}
              placeholder="#FF6B6B"
            />
            <View style={[styles.colorPreview, { backgroundColor: localTheme.itemColors.scene }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Symbols</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Era Symbol</Text>
          <TextInput
            style={styles.symbolInput}
            value={localTheme.symbols.era}
            onChangeText={(symbol) => updateColor('symbols', 'era', symbol)}
            placeholder="📅"
            maxLength={2}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Event Symbol</Text>
          <TextInput
            style={styles.symbolInput}
            value={localTheme.symbols.event}
            onChangeText={(symbol) => updateColor('symbols', 'event', symbol)}
            placeholder="⭐"
            maxLength={2}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Scene Symbol</Text>
          <TextInput
            style={styles.symbolInput}
            value={localTheme.symbols.scene}
            onChangeText={(symbol) => updateColor('symbols', 'scene', symbol)}
            placeholder="🎬"
            maxLength={2}
          />
        </View>

        <Text style={styles.sectionTitle}>Font Sizes</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Title Size: {localTheme.fontSizes.title}</Text>
          <TextInput
            style={styles.numberInput}
            value={String(localTheme.fontSizes.title)}
            onChangeText={(size) => updateFontSize('title', size)}
            keyboardType="numeric"
            placeholder="16"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description Size: {localTheme.fontSizes.description}</Text>
          <TextInput
            style={styles.numberInput}
            value={String(localTheme.fontSizes.description)}
            onChangeText={(size) => updateFontSize('description', size)}
            keyboardType="numeric"
            placeholder="14"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Time Size: {localTheme.fontSizes.time}</Text>
          <TextInput
            style={styles.numberInput}
            value={String(localTheme.fontSizes.time)}
            onChangeText={(size) => updateFontSize('time', size)}
            keyboardType="numeric"
            placeholder="12"
          />
        </View>

        <Text style={styles.sectionTitle}>Spacing</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Item Spacing: {localTheme.spacing.item}</Text>
          <TextInput
            style={styles.numberInput}
            value={String(localTheme.spacing.item)}
            onChangeText={(value) => updateSpacing('item', value)}
            keyboardType="numeric"
            placeholder="12"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Line Width: {localTheme.spacing.line}</Text>
          <TextInput
            style={styles.numberInput}
            value={String(localTheme.spacing.line)}
            onChangeText={(value) => updateSpacing('line', value)}
            keyboardType="numeric"
            placeholder="3"
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Theme</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset to Default</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  colorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  symbolInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimelineSettingsScreen;

