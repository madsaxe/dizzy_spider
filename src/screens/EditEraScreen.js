import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import TimeInput from '../components/TimeInput';
import { validateEra } from '../utils/validation';
import timelineService from '../services/timelineService';

const EditEraScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { era } = route.params;
  const { updateEra } = useApp();
  const [title, setTitle] = useState(era.title || '');
  const [description, setDescription] = useState(era.description || '');
  const [startTime, setStartTime] = useState(era.startTime || null);
  const [endTime, setEndTime] = useState(era.endTime || null);
  const [loading, setLoading] = useState(false);
  const [isFictional, setIsFictional] = useState(false);

  useEffect(() => {
    const loadTimeline = async () => {
      const timeline = await timelineService.getTimelineById(era.timelineId);
      if (timeline) {
        setIsFictional(timeline.isFictional);
      }
    };
    loadTimeline();
  }, [era.timelineId]);

  const handleUpdate = async () => {
    const eraData = {
      title: title.trim(),
      description: description.trim(),
      startTime: startTime || null,
      endTime: endTime || null,
    };

    const validation = validateEra({ ...era, ...eraData });
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      await updateEra(era.id, eraData);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update era. Please try again.');
      console.error('Error updating era:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter era title"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter era description (optional)"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <TimeInput
          label="Time Range"
          mode="range"
          isFictional={isFictional}
          startValue={startTime}
          endValue={endTime}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
        />

        <TouchableOpacity
          style={[styles.updateButton, loading && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.updateButtonText}>
            {loading ? 'Updating...' : 'Update Era'}
          </Text>
        </TouchableOpacity>
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EditEraScreen;

