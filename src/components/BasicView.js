import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { getLocalImage, hasLocalImage } from '../assets/images';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const BASE_ERA_HEIGHT = screenHeight * 0.30; // 30% of screen
const BASE_EVENT_HEIGHT = screenHeight * 0.25; // 25% of screen
const BASE_SCENE_HEIGHT = screenHeight * 0.20; // 20% of screen
const INDENT_WIDTH = 20;
const MIN_ZOOM = 0.08; // 8% of screen height minimum

const BasicView = ({
  data = [],
  onItemPress,
  onItemEdit,
  onRefresh,
  refreshing = false,
  colors = {},
  showImages = true,
  fontSizes = { title: 16, description: 14, time: 12 },
  events = {},
  scenes = {},
  isFictional = false,
  zoomScale = 1.0, // Zoom scale (0.08 to 1.0, where 0.08 = 8% of screen)
}) => {
  // Calculate dynamic heights based on zoom scale
  const ERA_HEIGHT = Math.max(screenHeight * MIN_ZOOM, BASE_ERA_HEIGHT * zoomScale);
  const EVENT_HEIGHT = Math.max(screenHeight * MIN_ZOOM, BASE_EVENT_HEIGHT * zoomScale);
  const SCENE_HEIGHT = Math.max(screenHeight * MIN_ZOOM, BASE_SCENE_HEIGHT * zoomScale);
  const [expandedEras, setExpandedEras] = useState(new Set());
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  const toggleEra = (eraId) => {
    setExpandedEras((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eraId)) {
        newSet.delete(eraId);
        // Also collapse all events in this era
        const eraEvents = events[eraId] || [];
        setExpandedEvents((prevEvents) => {
          const newEventSet = new Set(prevEvents);
          eraEvents.forEach((event) => newEventSet.delete(event.id));
          return newEventSet;
        });
      } else {
        newSet.add(eraId);
      }
      return newSet;
    });
  };

  const toggleEvent = (eventId) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const formatTime = (timeString, isFictional) => {
    if (!timeString) return '';
    if (isFictional) return timeString;
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return timeString;
    }
  };

  const formatTimeRange = (startTime, endTime, isFictional) => {
    if (!startTime && !endTime) return '';
    if (isFictional) {
      return `${startTime || ''} - ${endTime || ''}`;
    }
    try {
      const start = startTime ? new Date(startTime) : null;
      const end = endTime ? new Date(endTime) : null;
      if (!start && !end) return '';
      if (!end) return formatTime(startTime, isFictional);
      if (!start) return formatTime(endTime, isFictional);
      return `${formatTime(startTime, isFictional)} - ${formatTime(endTime, isFictional)}`;
    } catch {
      return `${startTime || ''} - ${endTime || ''}`;
    }
  };

  const getImageSource = (imageUrl) => {
    if (!showImages || !imageUrl) return null;

    if (hasLocalImage(imageUrl)) {
      return getLocalImage(imageUrl);
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return { uri: imageUrl };
    }

    return null;
  };

  const renderEra = (era, index) => {
    const isExpanded = expandedEras.has(era.id);
    const eraEvents = events[era.id] || [];
    const hasEvents = eraEvents.length > 0;
    const imageSource = getImageSource(era.imageUrl);
    const backgroundColor = colors.era || '#8B5CF6';

    return (
      <View key={era.id} style={styles.eraContainer}>
        <TouchableOpacity
          style={[styles.eraBar, { height: ERA_HEIGHT }]}
          onPress={() => {
            toggleEra(era.id);
            if (onItemPress) {
              onItemPress({ _originalData: { type: 'era', data: era } }, index);
            }
          }}
          activeOpacity={0.8}
        >
          {imageSource && (
            <Image
              source={imageSource}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          )}
          <View style={[styles.colorOverlay, { backgroundColor }]} />
          <View style={styles.barContent}>
            <View style={styles.barTextContainer}>
              <Text style={styles.barTitle} numberOfLines={2}>
                {era.title}
              </Text>
              {era.description && (
                <Text style={styles.barDescription} numberOfLines={2}>
                  {era.description}
                </Text>
              )}
              {(era.startTime || era.endTime) && (
                <Text style={styles.barTime}>
                  {formatTimeRange(era.startTime, era.endTime, isFictional)}
                </Text>
              )}
            </View>
            {hasEvents && (
              <View style={styles.expandIndicator}>
                <Text style={styles.childCount}>{eraEvents.length}</Text>
                <Text style={styles.expandIcon}>
                  {isExpanded ? '▼' : '▶'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && hasEvents && (
          <Animated.View 
            style={styles.eventsContainer}
            entering={FadeInDown.duration(300).springify()}
            exiting={FadeOutUp.duration(200)}
          >
            {eraEvents.map((event, eventIndex) => renderEvent(event, eventIndex, era.id))}
          </Animated.View>
        )}
      </View>
    );
  };

  const renderEvent = (event, index, eraId) => {
    const isExpanded = expandedEvents.has(event.id);
    const eventScenes = scenes[event.id] || [];
    const hasScenes = eventScenes.length > 0;
    const imageSource = getImageSource(event.imageUrl);
    const backgroundColor = colors.event || '#4CAF50';

    return (
      <View key={event.id} style={styles.eventContainer}>
        <TouchableOpacity
          style={[styles.eventBar, { height: EVENT_HEIGHT }]}
          onPress={() => {
            toggleEvent(event.id);
            if (onItemPress) {
              onItemPress({ _originalData: { type: 'event', data: event } }, index);
            }
          }}
          activeOpacity={0.8}
        >
          {imageSource && (
            <Image
              source={imageSource}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          )}
          <View style={[styles.colorOverlay, { backgroundColor }]} />
          <View style={styles.barContent}>
            <View style={styles.barTextContainer}>
              <Text style={styles.barTitle} numberOfLines={2}>
                {event.title}
              </Text>
              {event.description && (
                <Text style={styles.barDescription} numberOfLines={2}>
                  {event.description}
                </Text>
              )}
              {event.time && (
                <Text style={styles.barTime}>
                  {formatTime(event.time, isFictional)}
                </Text>
              )}
            </View>
            {hasScenes && (
              <View style={styles.expandIndicator}>
                <Text style={styles.childCount}>{eventScenes.length}</Text>
                <Text style={styles.expandIcon}>
                  {isExpanded ? '▼' : '▶'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && hasScenes && (
          <Animated.View 
            style={styles.scenesContainer}
            entering={FadeInDown.duration(300).springify()}
            exiting={FadeOutUp.duration(200)}
          >
            {eventScenes.map((scene, sceneIndex) => renderScene(scene, sceneIndex, event.id))}
          </Animated.View>
        )}
      </View>
    );
  };

  const renderScene = (scene, index, eventId) => {
    const imageSource = getImageSource(scene.imageUrl);
    const backgroundColor = colors.scene || '#FF9800';

    return (
      <TouchableOpacity
        key={scene.id}
        style={[styles.sceneBar, { height: SCENE_HEIGHT }]}
        onPress={() => {
          if (onItemPress) {
            onItemPress({ _originalData: { type: 'scene', data: scene } }, index);
          }
        }}
        activeOpacity={0.8}
      >
        {imageSource && (
          <Image
            source={imageSource}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        )}
        <View style={[styles.colorOverlay, { backgroundColor }]} />
        <View style={styles.barContent}>
          <View style={styles.barTextContainer}>
            <Text style={styles.barTitle} numberOfLines={2}>
              {scene.title}
            </Text>
            {scene.description && (
              <Text style={styles.barDescription} numberOfLines={2}>
                {scene.description}
              </Text>
            )}
            {scene.time && (
              <Text style={styles.barTime}>
                {formatTime(scene.time, isFictional)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Filter to show only Eras initially
  const eras = data.filter((item) => {
    const itemType = item._originalData?.type || item.type;
    return itemType === 'era';
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {eras.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No eras yet. Add your first era to get started!</Text>
        </View>
      ) : (
        eras.map((era, index) => {
          const eraData = era._originalData?.data || era.data || era;
          return renderEra(eraData, index);
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  contentContainer: {
    paddingVertical: 8,
  },
  eraContainer: {
    marginBottom: 4,
  },
  eraBar: {
    width: '100%',
    // height is set dynamically via inline style
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  eventContainer: {
    marginLeft: INDENT_WIDTH,
    marginTop: 4,
  },
  eventBar: {
    width: screenWidth - INDENT_WIDTH * 2,
    // height is set dynamically via inline style
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  scenesContainer: {
    marginLeft: INDENT_WIDTH,
  },
  sceneBar: {
    width: screenWidth - INDENT_WIDTH * 4,
    // height is set dynamically via inline style
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: -20, // Extend 20px beyond left bound
    right: -20, // Extend 20px beyond right bound
    bottom: 0,
    width: screenWidth + 40, // Extend 40px total beyond bounds
    height: '100%',
  },
  colorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.75, // Adjust opacity to balance image visibility and text readability
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    zIndex: 1, // Ensure content is above background and overlay
  },
  barTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  barTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  barDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  barTime: {
    fontSize: 18, // Increased size
    color: '#FFFFFF',
    fontWeight: '800', // Bolder
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // Stronger shadow for readability
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3, // Increased shadow radius
  },
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  childCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  expandIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventsContainer: {
    // Container for expanded events
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
  },
});

export default BasicView;

