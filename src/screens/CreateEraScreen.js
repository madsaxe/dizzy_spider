import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Button, Text, Card, useTheme, SegmentedButtons } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import TimeInput from '../components/TimeInput';
import { validateEra } from '../utils/validation';
import timelineService from '../services/timelineService';
import imageService from '../services/imageService';

const CreateEraScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
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
  const [imageSourceType, setImageSourceType] = useState('picker'); // 'picker' or 'url'
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          onPress={() => navigation.goBack()}
          textColor={theme.colors.primary}
        >
          Cancel
        </Button>
      ),
    });
  }, [navigation, theme]);

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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}
      >
        <TextInput
          label="Title *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        {isFictional && existingEras.length > 0 && (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Position After Era (Optional)
            </Text>
            <Text variant="bodySmall" style={styles.hint}>
              Select an era to position this era after it, or leave blank and specify custom times below.
            </Text>
            {existingEras.map((era) => (
              <Card
                key={era.id}
                style={[
                  styles.eraOption,
                  positionRelativeTo === era.id && styles.eraOptionSelected,
                ]}
                onPress={() => setPositionRelativeTo(era.id === positionRelativeTo ? null : era.id)}
              >
                <Card.Content>
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.eraOptionText,
                      positionRelativeTo === era.id && styles.eraOptionTextSelected,
                    ]}
                  >
                    {era.title}
                  </Text>
                </Card.Content>
              </Card>
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

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Hero Image (Optional)
        </Text>
        
        {!imageUrl && (
          <SegmentedButtons
            value={imageSourceType}
            onValueChange={setImageSourceType}
            buttons={[
              { value: 'picker', label: 'Select Image' },
              { value: 'url', label: 'Enter URL' },
            ]}
            style={styles.imageSourceToggle}
          />
        )}

        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            <Button
              mode="outlined"
              onPress={() => {
                setImageUrl(null);
                setImageUrlInput('');
              }}
              style={styles.removeImageButton}
              textColor={theme.colors.error}
            >
              Remove Image
            </Button>
          </View>
        ) : imageSourceType === 'picker' ? (
          <Button
            mode="outlined"
            onPress={async () => {
              const uri = await imageService.showImagePicker();
              if (uri) {
                setImageUrl(uri);
              }
            }}
            style={styles.imagePickerButton}
          >
            Select Image
          </Button>
        ) : (
          <View>
            <TextInput
              label="Image URL"
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              mode="outlined"
              placeholder="https://example.com/image.jpg"
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={() => {
                if (imageUrlInput.trim()) {
                  setImageUrl(imageUrlInput.trim());
                } else {
                  Alert.alert('Error', 'Please enter a valid URL');
                }
              }}
              style={styles.useUrlButton}
            >
              Use URL
            </Button>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleCreate}
          disabled={loading}
          loading={loading}
          style={styles.createButton}
        >
          {loading ? 'Creating...' : 'Create Era'}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  createButton: {
    marginTop: 32,
  },
  eraOption: {
    marginBottom: 8,
  },
  eraOptionSelected: {
    borderWidth: 2,
  },
  eraOptionText: {
    color: '#E0E0E0',
  },
  eraOptionTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  hint: {
    marginTop: 8,
    marginBottom: 12,
  },
  imageContainer: {
    marginVertical: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#0F0F1E',
  },
  imageSourceToggle: {
    marginBottom: 16,
  },
  imagePickerButton: {
    marginTop: 8,
  },
  useUrlButton: {
    marginTop: 8,
  },
  removeImageButton: {
    marginTop: 8,
  },
});

export default CreateEraScreen;

