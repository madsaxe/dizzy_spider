import React, { useState, useEffect } from 'react';
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
  const [imageUrl, setImageUrl] = useState(era.imageUrl || null);

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
      imageUrl: imageUrl || null,
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

        <Text style={styles.label}>Hero Image (Optional)</Text>
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={async () => {
                  const uri = await imageService.showImagePicker();
                  if (uri) {
                    setImageUrl(uri);
                  }
                }}
              >
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUrl(null)}
              >
                <Text style={styles.removeImageText}>Remove</Text>
              </TouchableOpacity>
            </View>
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
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  changeImageButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
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
    flex: 1,
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

export default EditEraScreen;

