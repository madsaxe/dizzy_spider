import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { getLocalImage, hasLocalImage } from '../assets/images';
import timelineService from '../services/timelineService';

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
  zoomScale = 1.0, // Zoom scale (0.08 to 1.0, where 0.08 = 8% of screen) - can be shared value or number
}) => {
  // Track zoom scale - for shared values, use requestAnimationFrame to poll for updates
  // This avoids feedback loops from useAnimatedReaction
  const isSharedValue = typeof zoomScale === 'object' && zoomScale?.value !== undefined;
  const [currentZoomScale, setCurrentZoomScale] = useState(
    isSharedValue ? zoomScale.value : zoomScale
  );
  
  // For shared values, poll using requestAnimationFrame for smooth updates
  // Store zoomScale in a ref so we can access it in the polling function
  const zoomScaleRef = useRef(zoomScale);
  useEffect(() => {
    zoomScaleRef.current = zoomScale;
  }, [zoomScale]);
  
  useEffect(() => {
    if (!isSharedValue) {
      setCurrentZoomScale(zoomScale);
      return;
    }
    
    let rafId;
    let lastValue = isSharedValue ? zoomScale.value : zoomScale;
    
    const pollZoom = () => {
      const currentZoom = zoomScaleRef.current;
      if (currentZoom && typeof currentZoom === 'object' && typeof currentZoom.value === 'number') {
        const newValue = currentZoom.value;
        // Only update if value changed significantly
        if (Math.abs(newValue - lastValue) > 0.0001) {
          setCurrentZoomScale(newValue);
          lastValue = newValue;
        }
      }
      rafId = requestAnimationFrame(pollZoom);
    };
    
    rafId = requestAnimationFrame(pollZoom);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isSharedValue]); // Only depend on isSharedValue to avoid loops
  
  // Calculate dynamic heights based on zoom scale
  const ERA_HEIGHT = Math.max(screenHeight * MIN_ZOOM, BASE_ERA_HEIGHT * currentZoomScale);
  const EVENT_HEIGHT = Math.max(screenHeight * MIN_ZOOM, BASE_EVENT_HEIGHT * currentZoomScale);
  const SCENE_HEIGHT = Math.max(screenHeight * MIN_ZOOM, BASE_SCENE_HEIGHT * currentZoomScale);
  const [expandedEras, setExpandedEras] = useState(new Set());
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'era'|'event'|'scene', id, data, parentId }
  const [dropTarget, setDropTarget] = useState(null); // { type, id, position: 'above'|'below' }
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateModalData, setDateModalData] = useState(null); // { item, newPosition, requiresDate }
  const dragPosition = useSharedValue({ x: 0, y: 0 });
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);
  const itemLayouts = useRef(new Map()); // Store layout positions for drop target detection
  const isDraggingRef = useRef(false);

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

  // Drag and drop helper functions
  const handleStartDrag = (item, type, parentId = null) => {
    isDraggingRef.current = true;
    setDraggedItem({ type, id: item.id, data: item, parentId });
    dragScale.value = withSpring(1.15, { damping: 15, stiffness: 300 });
    dragOpacity.value = withSpring(0.8, { damping: 15, stiffness: 300 });
  };

  const handleEndDrag = () => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    dragScale.value = withSpring(1);
    dragOpacity.value = withSpring(1);
    dragPosition.value = { x: 0, y: 0 };
    
    if (dropTarget && draggedItem) {
      handleDrop(draggedItem, dropTarget);
    } else {
      setDraggedItem(null);
      setDropTarget(null);
    }
  };

  const handleDragUpdate = (event) => {
    if (!isDraggingRef.current) return;
    
    dragPosition.value = {
      x: event.translationX,
      y: event.translationY,
    };
    
    detectDropTarget(event.absoluteX, event.absoluteY);
  };

  const detectDropTarget = (x, y) => {
    let foundTarget = null;
    
    itemLayouts.current.forEach((layout, key) => {
      const { type, id, y: layoutY, height } = layout;
      const midY = layoutY + height / 2;
      
      if (y >= layoutY && y <= layoutY + height) {
        const position = y < midY ? 'above' : 'below';
        foundTarget = { type, id, position };
      }
    });
    
    if (foundTarget) {
      setDropTarget(foundTarget);
    } else {
      setDropTarget(null);
    }
  };

  const handleDrop = async (item, target) => {
    const requiresDate = !isFictional && (item.data.time || item.data.startTime);
    
    if (requiresDate) {
      setDateModalData({ item, target, requiresDate });
      setShowDateModal(true);
      setDraggedItem(null);
      setDropTarget(null);
    } else {
      await performReorder(item, target, null);
    }
  };

  const performReorder = async (item, target, newDate) => {
    try {
      const newOrder = calculateNewOrder(item, target);
      const newParentId = calculateNewParent(item, target);
      
      if (item.type === 'era') {
        await timelineService.updateEraOrder(item.id, newOrder);
        if (newDate) {
          await timelineService.updateEraDate(item.id, newDate);
        }
      } else if (item.type === 'event') {
        await timelineService.updateEventOrder(item.id, newOrder);
        if (newParentId && newParentId !== item.parentId) {
          await timelineService.updateEvent(item.id, { eraId: newParentId });
        }
        if (newDate) {
          await timelineService.updateEventDate(item.id, newDate);
        }
      } else if (item.type === 'scene') {
        await timelineService.updateSceneOrder(item.id, newOrder);
        if (newParentId && newParentId !== item.parentId) {
          await timelineService.updateScene(item.id, { eventId: newParentId });
        }
        if (newDate) {
          await timelineService.updateSceneDate(item.id, newDate);
        }
      }
      
      if (onRefresh) {
        onRefresh();
      }
      
      setDraggedItem(null);
      setDropTarget(null);
    } catch (error) {
      console.error('Error reordering item:', error);
      Alert.alert('Error', 'Failed to reorder item. Please try again.');
    }
  };

  const calculateNewOrder = (item, target) => {
    let itemsAtLevel = [];
    
    if (target.type === 'era') {
      itemsAtLevel = data
        .filter(d => {
          const itemType = d._originalData?.type || d.type;
          return itemType === 'era';
        })
        .map(d => d._originalData?.data || d.data || d)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } else if (target.type === 'event') {
      itemsAtLevel = (events[target.id] || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } else if (target.type === 'scene') {
      itemsAtLevel = (scenes[target.id] || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    const targetIndex = itemsAtLevel.findIndex(i => i.id === target.id);
    if (targetIndex === -1) return item.data.order || 0;
    
    if (target.position === 'above') {
      const targetOrder = itemsAtLevel[targetIndex].order || 0;
      return Math.max(0, targetOrder - 1);
    } else {
      const targetOrder = itemsAtLevel[targetIndex].order || 0;
      return targetOrder + 1;
    }
  };

  const calculateNewParent = (item, target) => {
    if (item.type === 'event' && target.type === 'era') {
      return target.id;
    }
    if (item.type === 'scene' && target.type === 'event') {
      return target.id;
    }
    return item.parentId;
  };

  const validateDate = (dateString, item, target) => {
    if (isFictional) return true;
    
    try {
      const newDate = new Date(dateString);
      if (isNaN(newDate.getTime())) return false;
      return true;
    } catch {
      return false;
    }
  };

  // Animated style for dragged item
  const draggedItemStyle = useAnimatedStyle(() => {
    if (!draggedItem) {
      return {};
    }
    return {
      transform: [
        { translateX: dragPosition.value.x },
        { translateY: dragPosition.value.y },
        { scale: dragScale.value },
      ],
      opacity: dragOpacity.value,
      borderWidth: 3,
      borderColor: '#8B5CF6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 10,
      zIndex: 1000,
    };
  });

  const renderEra = (era, index) => {
    const isExpanded = expandedEras.has(era.id);
    const eraEvents = events[era.id] || [];
    const hasEvents = eraEvents.length > 0;
    const imageSource = getImageSource(era.imageUrl);
    const backgroundColor = colors.era || '#8B5CF6';
    const isDragging = draggedItem?.id === era.id;
    const isDropTarget = dropTarget?.id === era.id && dropTarget?.type === 'era';

    // Create drag gesture - only works with single finger
    // LongPress doesn't support minPointers, but we can use Pan's minPointers/maxPointers
    const longPress = Gesture.LongPress()
      .minDuration(150)
      .onStart(() => {
        runOnJS(handleStartDrag)(era, 'era', null);
      });

    const pan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1) // Only single finger - prevents conflict with 2-finger pinch
      .enabled(isDraggingRef.current)
      .onUpdate((event) => {
        runOnJS(handleDragUpdate)(event);
      })
      .onEnd(() => {
        runOnJS(handleEndDrag)();
      });

    // Combine gestures - Pan's maxPointers(1) ensures only single finger works
    const composedGesture = Gesture.Simultaneous(longPress, pan);

    return (
      <View 
        key={era.id} 
        style={styles.eraContainer}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          itemLayouts.current.set(`era-${era.id}`, { type: 'era', id: era.id, y, height });
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.eraBar,
              { height: ERA_HEIGHT },
              isDragging && draggedItemStyle,
              isDropTarget && styles.dropTarget,
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (!isDragging) {
                  toggleEra(era.id);
                  if (onItemPress) {
                    onItemPress({ _originalData: { type: 'era', data: era } }, index);
                  }
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
          </Animated.View>
        </GestureDetector>
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
    const isDragging = draggedItem?.id === event.id;
    const isDropTarget = dropTarget?.id === event.id && dropTarget?.type === 'event';

    // Create drag gesture - single finger only
    const longPress = Gesture.LongPress()
      .minDuration(150)
      .onStart(() => {
        runOnJS(handleStartDrag)(event, 'event', eraId);
      });

    const pan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1) // Only single finger - prevents conflict with 2-finger pinch
      .enabled(isDraggingRef.current)
      .onUpdate((event) => {
        runOnJS(handleDragUpdate)(event);
      })
      .onEnd(() => {
        runOnJS(handleEndDrag)();
      });

    const composedGesture = Gesture.Simultaneous(longPress, pan);

    return (
      <View 
        key={event.id} 
        style={styles.eventContainer}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          itemLayouts.current.set(`event-${event.id}`, { type: 'event', id: event.id, y, height });
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.eventBar,
              { height: EVENT_HEIGHT },
              isDragging && draggedItemStyle,
              isDropTarget && styles.dropTarget,
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (!isDragging) {
                  toggleEvent(event.id);
                  if (onItemPress) {
                    onItemPress({ _originalData: { type: 'event', data: event } }, index);
                  }
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
          </Animated.View>
        </GestureDetector>
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
    const isDragging = draggedItem?.id === scene.id;
    const isDropTarget = dropTarget?.id === scene.id && dropTarget?.type === 'scene';

    // Create drag gesture - single finger only
    const longPress = Gesture.LongPress()
      .minDuration(150)
      .onStart(() => {
        runOnJS(handleStartDrag)(scene, 'scene', eventId);
      });

    const pan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1) // Only single finger - prevents conflict with 2-finger pinch
      .enabled(isDraggingRef.current)
      .onUpdate((event) => {
        runOnJS(handleDragUpdate)(event);
      })
      .onEnd(() => {
        runOnJS(handleEndDrag)();
      });

    const composedGesture = Gesture.Simultaneous(longPress, pan);

    return (
      <View
        key={scene.id}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          itemLayouts.current.set(`scene-${scene.id}`, { type: 'scene', id: scene.id, y, height });
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.sceneBar,
              { height: SCENE_HEIGHT },
              isDragging && draggedItemStyle,
              isDropTarget && styles.dropTarget,
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (!isDragging) {
                  if (onItemPress) {
                    onItemPress({ _originalData: { type: 'scene', data: scene } }, index);
                  }
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
          </Animated.View>
        </GestureDetector>
      </View>
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
      
      {/* Date Update Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDateModal(false);
          setDateModalData(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Date</Text>
            <Text style={styles.modalText}>
              Please enter a new date for this item:
            </Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={dateModalData?.newDate || ''}
              onChangeText={(text) => {
                setDateModalData(prev => ({ ...prev, newDate: text }));
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowDateModal(false);
                  setDateModalData(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={async () => {
                  if (dateModalData?.newDate && dateModalData?.item && dateModalData?.target) {
                    if (validateDate(dateModalData.newDate, dateModalData.item, dateModalData.target)) {
                      await performReorder(dateModalData.item, dateModalData.target, dateModalData.newDate);
                      setShowDateModal(false);
                      setDateModalData(null);
                    } else {
                      Alert.alert('Invalid Date', 'Please enter a valid date.');
                    }
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  dropTarget: {
    borderWidth: 3,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 16,
  },
  dateInput: {
    backgroundColor: '#16213E',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#2A2A3E',
  },
  modalButtonConfirm: {
    backgroundColor: '#8B5CF6',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BasicView;

