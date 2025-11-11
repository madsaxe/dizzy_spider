import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import TimeInput from '../components/TimeInput';
import { validateEra } from '../utils/validation';
import timelineService from '../services/timelineService';
import imageService from '../services/imageService';

const CreateEraScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { timelineId } = route.params;
  const { createEra } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFictional, setIsFictional] = useState(false);
  const [existingEras, setExistingEras] = useState([]);
  const [positionRelativeTo, setPositionRelativeTo] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  React.useEffect(() => {
    const loadData = async () => {
      const timeline = await timelineService.getTimelineById(timelineId);
      if (timeline) {
        setIsFictional(timeline.isFictional);
        
        // Load existing eras for relative positioning (fictional timelines only)
        if (timeline.isFictional) {
          const eras = await timelineService.getErasByTimelineId(timelineId);
          setExistingEras(eras);
          // If there are existing eras, require selecting which one this follows
          if (eras.length > 0 && !positionRelativeTo) {
            // Don't set a default - user must choose
          }
        }
      }
    };
    loadData();
  }, [timelineId]);

  const handleCreate = async () => {
    // For fictional timelines with existing eras, require either relative positioning OR custom times
    if (isFictional && existingEras.length > 0 && !positionRelativeTo && !startTime) {
      Alert.alert('Validation Error', 'Please either select which era this new era follows, or specify a custom start time.');
      return;
    }

    const eraData = {
      timelineId,
      title: title.trim(),
      description: description.trim(),
      startTime: startTime || null,
      endTime: endTime || null,
      order: 0,
      positionRelativeTo: isFictional && existingEras.length > 0 ? positionRelativeTo : null,
      positionType: isFictional && existingEras.length > 0 && positionRelativeTo ? 'after' : null,
      imageUrl: imageUrl || null,
    };

    const validation = validateEra(eraData);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const { era, unlockedAchievements } = await createEra(eraData);
      
      if (unlockedAchievements && unlockedAchievements.length > 0) {
        const achievementNames = unlockedAchievements.map(a => a.name).join(', ');
        Alert.alert('Achievement Unlocked! 🎉', `You've unlocked: ${achievementNames}`);
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create era. Please try again.');
      console.error('Error creating era:', error);
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

        {isFictional && existingEras.length > 0 && (
          <View>
            <Text style={styles.label}>Position After Era (Optional)</Text>
            <Text style={styles.hint}>
              Select an era to position this era after it, or leave blank and specify custom times below.
            </Text>
            {existingEras.map((era) => (
              <TouchableOpacity
                key={era.id}
                style={[
                  styles.eraOption,
                  positionRelativeTo === era.id && styles.eraOptionSelected,
                ]}
                onPress={() => setPositionRelativeTo(era.id === positionRelativeTo ? null : era.id)}
              >
                <Text
                  style={[
                    styles.eraOptionText,
                    positionRelativeTo === era.id && styles.eraOptionTextSelected,
                  ]}
                >
                  {era.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TimeInput
          label="Time Range"
          mode="range"
          isFictional={isFictional}
          startValue={startTime}
          endValue={endTime}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
        />

        <Text style={styles.label}>Hero Image (Optional)</Text>
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImageUrl(null)}
            >
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={async () => {
              const uri = await imageService.showImagePicker();
              if (uri) {
                setImageUrl(uri);
              }
            }}
          >
            <Text style={styles.imagePickerText}>Select Image</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Era'}
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
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  eraOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  eraOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  eraOptionText: {
    fontSize: 16,
    color: '#333',
  },
  eraOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  imageContainer: {
    marginVertical: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  imagePickerText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removeImageButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 6,
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateEraScreen;

