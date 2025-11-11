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
import { validateScene } from '../utils/validation';
import timelineService from '../services/timelineService';
import imageService from '../services/imageService';

const CreateSceneScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { eventId } = route.params;
  const { createScene } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(null);
  const [useRelativePosition, setUseRelativePosition] = useState(false);
  const [positionRelativeTo, setPositionRelativeTo] = useState(null);
  const [positionType, setPositionType] = useState('after');
  const [availableScenes, setAvailableScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFictional, setIsFictional] = useState(false);
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
      const event = await timelineService.getEventById(eventId);
      if (event) {
        const era = await timelineService.getEraById(event.eraId);
        if (era) {
          const timeline = await timelineService.getTimelineById(era.timelineId);
          if (timeline) {
            setIsFictional(timeline.isFictional);
          }
        }
        const scenes = await timelineService.getScenesByEventId(eventId);
        setAvailableScenes(scenes);
      }
    };
    loadData();
  }, [eventId]);

  const handleCreate = async () => {
    const sceneData = {
      eventId,
      title: title.trim(),
      description: description.trim(),
      time: useRelativePosition ? null : (time || null),
      order: 0,
      positionRelativeTo: useRelativePosition ? positionRelativeTo : null,
      positionType: useRelativePosition ? positionType : null,
      imageUrl: imageUrl || null,
    };

    const validation = validateScene(sceneData);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const { scene, unlockedAchievements } = await createScene(sceneData);
      
      if (unlockedAchievements && unlockedAchievements.length > 0) {
        const achievementNames = unlockedAchievements.map(a => a.name).join(', ');
        Alert.alert('Achievement Unlocked! 🎉', `You've unlocked: ${achievementNames}`);
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create scene. Please try again.');
      console.error('Error creating scene:', error);
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

        <SegmentedButtons
          value={useRelativePosition ? 'relative' : 'time'}
          onValueChange={(value) => setUseRelativePosition(value === 'relative')}
          buttons={[
            { value: 'time', label: 'Specific Time' },
            { value: 'relative', label: 'Relative Position' },
          ]}
          style={styles.toggleButton}
        />

        {useRelativePosition ? (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Position Relative To *
            </Text>
            {availableScenes.length === 0 ? (
              <Text variant="bodySmall" style={styles.hint}>
                No other scenes in this event yet
              </Text>
            ) : (
              <>
                {availableScenes.map((scene) => (
                  <Card
                    key={scene.id}
                    style={[
                      styles.sceneOption,
                      positionRelativeTo === scene.id && styles.sceneOptionSelected,
                    ]}
                    onPress={() => setPositionRelativeTo(scene.id)}
                  >
                    <Card.Content>
                      <Text
                        variant="bodyLarge"
                        style={[
                          styles.sceneOptionText,
                          positionRelativeTo === scene.id && styles.sceneOptionTextSelected,
                        ]}
                      >
                        {scene.title}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
                <SegmentedButtons
                  value={positionType}
                  onValueChange={setPositionType}
                  buttons={[
                    { value: 'before', label: 'Before' },
                    { value: 'after', label: 'After' },
                  ]}
                  style={styles.positionTypeContainer}
                />
              </>
            )}
          </View>
        ) : (
          <TimeInput
            label="Time"
            value={time}
            onChange={setTime}
            isFictional={isFictional}
            isRelational={false}
            placeholder="Enter time"
          />
        )}

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
          {loading ? 'Creating...' : 'Create Scene'}
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
  toggleButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  createButton: {
    marginTop: 32,
  },
  sceneOption: {
    marginBottom: 8,
  },
  sceneOptionSelected: {
    borderWidth: 2,
  },
  sceneOptionText: {
    color: '#E0E0E0',
  },
  sceneOptionTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  positionTypeContainer: {
    marginTop: 12,
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

export default CreateSceneScreen;

