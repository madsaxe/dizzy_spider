import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { TextInput, Text, useTheme } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import TimeInput from '../components/TimeInput';
import { validateEvent } from '../utils/validation';
import timelineService from '../services/timelineService';
import imageService from '../services/imageService';

const EditEventScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { event } = route.params;
  const { updateEvent } = useApp();
  const [title, setTitle] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [time, setTime] = useState(event.time || null);
  const [useRelativePosition, setUseRelativePosition] = useState(!event.time && event.positionRelativeTo);
  const [positionRelativeTo, setPositionRelativeTo] = useState(event.positionRelativeTo || null);
  const [positionType, setPositionType] = useState(event.positionType || 'after');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFictional, setIsFictional] = useState(false);
  const [imageUrl, setImageUrl] = useState(event.imageUrl || null);

  useEffect(() => {
    const loadData = async () => {
      const era = await timelineService.getEraById(event.eraId);
      if (era) {
        const timeline = await timelineService.getTimelineById(era.timelineId);
        if (timeline) {
          setIsFictional(timeline.isFictional);
        }
        const events = await timelineService.getEventsByEraId(event.eraId);
        setAvailableEvents(events.filter(e => e.id !== event.id));
      }
    };
    loadData();
  }, [event.eraId, event.id]);

  const handleUpdate = async () => {
    const eventData = {
      title: title.trim(),
      description: description.trim(),
      time: useRelativePosition ? null : (time || null),
      positionRelativeTo: useRelativePosition ? positionRelativeTo : null,
      positionType: useRelativePosition ? positionType : null,
      imageUrl: imageUrl || null,
    };

    const validation = validateEvent({ ...event, ...eventData });
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      await updateEvent(event.id, eventData);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update event. Please try again.');
      console.error('Error updating event:', error);
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
          placeholder="Enter event title"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter event description (optional)"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setUseRelativePosition(!useRelativePosition)}
        >
          <Text style={styles.toggleButtonText}>
            {useRelativePosition ? 'Using Relative Position' : 'Using Specific Time'}
          </Text>
        </TouchableOpacity>

        {useRelativePosition && (
          <View>
            <Text style={styles.label}>Position Relative To *</Text>
            {availableEvents.length === 0 ? (
              <Text style={styles.hint}>No other events in this era</Text>
            ) : (
              <>
                {availableEvents.map((evt) => (
                  <TouchableOpacity
                    key={evt.id}
                    style={[
                      styles.eventOption,
                      positionRelativeTo === evt.id && styles.eventOptionSelected,
                    ]}
                    onPress={() => setPositionRelativeTo(evt.id)}
                  >
                    <Text
                      style={[
                        styles.eventOptionText,
                        positionRelativeTo === evt.id && styles.eventOptionTextSelected,
                      ]}
                    >
                      {evt.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.positionTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.positionTypeButton,
                      positionType === 'before' && styles.positionTypeButtonSelected,
                    ]}
                    onPress={() => setPositionType('before')}
                  >
                    <Text
                      style={[
                        styles.positionTypeText,
                        positionType === 'before' && styles.positionTypeTextSelected,
                      ]}
                    >
                      Before
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.positionTypeButton,
                      positionType === 'after' && styles.positionTypeButtonSelected,
                    ]}
                    onPress={() => setPositionType('after')}
                  >
                    <Text
                      style={[
                        styles.positionTypeText,
                        positionType === 'after' && styles.positionTypeTextSelected,
                      ]}
                    >
                      After
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {isFictional && (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Custom Time (Fictional Timeline) {useRelativePosition && '(Optional)'}
            </Text>
            <Text variant="bodySmall" style={styles.hint}>
              {useRelativePosition
                ? 'Optionally enter custom time string in addition to relative positioning'
                : 'Enter custom time string (e.g., "Year 3000", "Before the Great War")'}
            </Text>
            <TextInput
              label="Time"
              value={time || ''}
              onChangeText={setTime}
              mode="outlined"
              placeholder="e.g., Year 3000"
              style={styles.input}
            />
          </View>
        )}

        {!isFictional && !useRelativePosition && (
          <TimeInput
            label="Time"
            value={time}
            onChange={setTime}
            isFictional={isFictional}
            isRelational={false}
            placeholder="Enter time"
          />
        )}

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
            {loading ? 'Updating...' : 'Update Event'}
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
  toggleButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  eventOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  eventOptionText: {
    fontSize: 16,
    color: '#333',
  },
  eventOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  positionTypeContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  positionTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  positionTypeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  positionTypeText: {
    fontSize: 16,
    color: '#333',
  },
  positionTypeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
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

export default EditEventScreen;

