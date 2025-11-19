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
  runOnUI,
} from 'react-native-reanimated';
import { getLocalImage, hasLocalImage } from '../assets/images';
import timelineService from '../services/timelineService';
import { Icon } from 'react-native-paper';

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
  onItemDelete,
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
  const [placeholderPosition, setPlaceholderPosition] = useState(null); // { type, id, position: 'above'|'below' }
  const [isLongPressing, setIsLongPressing] = useState(null); // { type, id } - tracks which item is being long pressed
  const [menuVisible, setMenuVisible] = useState(null); // { type, id } - tracks which item's menu is visible
  const dragPosition = useSharedValue({ x: 0, y: 0 });
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);
  const dragWidthScale = useSharedValue(1);
  const dragHeightScale = useSharedValue(1);
  const placeholderHeight = useSharedValue(0);
  const canDrag = useSharedValue(false); // Shared value to track if drag is allowed
  const isDraggingShared = useSharedValue(false); // Shared value to track dragging state for animated style
  const itemLayouts = useRef(new Map()); // Store layout positions for drop target detection
  const isDraggingRef = useRef(false);
  const scrollViewRef = useRef(null);
  const scrollPositionRef = useRef(0);

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
  const handleLongPressStart = (item, type) => {
    // Immediate feedback when long press starts
    setIsLongPressing({ type, id: item.id });
    // Set a timeout to clear if drag doesn't start
    setTimeout(() => {
      if (!isDraggingRef.current) {
        setIsLongPressing(null);
      }
    }, 200);
  };

  const handleLongPressEnd = () => {
    // Clear long press state if drag doesn't start
    if (!isDraggingRef.current) {
      setIsLongPressing(null);
    }
  };

  // Update shared values on UI thread
  const updateDragSharedValues = (layoutHeight) => {
    'worklet';
    console.log('updateDragSharedValues called on UI thread');
    canDrag.value = true; // Enable drag - this must be set before activating Pan
    isDraggingShared.value = true;
    dragPosition.value = { x: 0, y: 0 }; // Reset position
    dragScale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
    dragOpacity.value = withSpring(0.8, { damping: 15, stiffness: 300 });
    dragWidthScale.value = withSpring(0.85, { damping: 15, stiffness: 300 }); // Reduce width to 85%
    dragHeightScale.value = withSpring(0.85, { damping: 15, stiffness: 300 }); // Reduce height to 85%
    if (layoutHeight) {
      placeholderHeight.value = withSpring(layoutHeight, { damping: 15, stiffness: 300 });
    }
    console.log('canDrag.value set to:', canDrag.value);
  };

  const handleStartDrag = (item, type, parentId = null) => {
    console.log('handleStartDrag called', { type, id: item.id });
    isDraggingRef.current = true;
    
    // Set state on JS thread first
    setDraggedItem({ type, id: item.id, data: item, parentId });
    setIsLongPressing(null); // Clear long press state when drag actually starts
    
    // Get layout for placeholder
    const layoutKey = `${type}-${item.id}`;
    const layout = itemLayouts.current.get(layoutKey);
    const layoutHeight = layout ? layout.height : null;
    
    // Update shared values on UI thread
    runOnUI(updateDragSharedValues)(layoutHeight);
    
    // Don't set initial placeholder - only show it when we have a drop target
    // The placeholder will be set by detectDropTarget when dragging
    
    console.log('Drag started, canDrag should be true now');
  };

  const handleEndDrag = () => {
    console.log('handleEndDrag called', { draggedItem, dropTarget });
    
    // Don't check isDraggingRef - if handleEndDrag is called, we should end the drag
    // Reset the ref first
    isDraggingRef.current = false;
    
    // Reset shared values on UI thread
    runOnUI(() => {
      'worklet';
      canDrag.value = false;
      isDraggingShared.value = false;
      dragScale.value = withSpring(1);
      dragOpacity.value = withSpring(1);
      dragWidthScale.value = withSpring(1);
      dragHeightScale.value = withSpring(1);
      dragPosition.value = { x: 0, y: 0 };
      placeholderHeight.value = withSpring(0, { damping: 15, stiffness: 300 });
    })();
    
    setIsLongPressing(null);
    
    if (dropTarget && draggedItem) {
      handleDrop(draggedItem, dropTarget);
    } else {
      setDraggedItem(null);
      setDropTarget(null);
      setPlaceholderPosition(null);
    }
  };

  // Throttle drop target detection to improve performance
  const lastDetectTime = useRef(0);
  const THROTTLE_MS = 50; // Only detect every 50ms
  
  const handleDragUpdate = (event) => {
    // Throttle drop target detection to improve performance
    const now = Date.now();
    if (now - lastDetectTime.current < THROTTLE_MS) {
      return;
    }
    lastDetectTime.current = now;
    
    // detectDropTarget runs on JS thread
    detectDropTarget(event.absoluteX, event.absoluteY);
  };

  const detectDropTarget = (x, y) => {
    if (!draggedItem) return; // Don't detect if not dragging
    
    let foundTarget = null;
    let closestDistance = Infinity;
    
    // Determine valid drop target types based on what's being dragged
    // Scenes can only be dropped on events (to change parent) or scenes (to reorder)
    // Events can only be dropped on eras (to change parent) or events (to reorder)
    // Eras can only be dropped on eras (to reorder)
    const validTargetTypes = [];
    if (draggedItem.type === 'scene') {
      validTargetTypes.push('event', 'scene'); // Can move to different event or reorder scenes
    } else if (draggedItem.type === 'event') {
      validTargetTypes.push('era', 'event'); // Can move to different era or reorder events
    } else if (draggedItem.type === 'era') {
      validTargetTypes.push('era'); // Can only reorder eras
    }
    
    // Find the closest valid node to the drag position
    itemLayouts.current.forEach((layout, key) => {
      const { type, id, y: layoutY, height } = layout;
      
      // Skip invalid targets
      if (!validTargetTypes.includes(type)) {
        return;
      }
      
      // Skip the item being dragged
      if (draggedItem && draggedItem.id === id && draggedItem.type === type) {
        return;
      }
      
      // Ensure id is valid
      if (!id) {
        return;
      }
      
      const midY = layoutY + height / 2;
      const distance = Math.abs(y - midY);
      
      // Check if we're within the node's bounds
      if (y >= layoutY && y <= layoutY + height) {
        // If this is closer than previous matches, use it
        if (distance < closestDistance) {
          closestDistance = distance;
          const position = y < midY ? 'above' : 'below';
          foundTarget = { type, id, position };
        }
      }
    });
    
    if (foundTarget && foundTarget.id) {
      setDropTarget(foundTarget);
      // Update placeholder position based on drop target
      setPlaceholderPosition(foundTarget);
      const layoutKey = `${foundTarget.type}-${foundTarget.id}`;
      const layout = itemLayouts.current.get(layoutKey);
      if (layout && layout.height > 0) {
        // Use the dragged item's height, not the target's height
        const draggedLayoutKey = `${draggedItem.type}-${draggedItem.id}`;
        const draggedLayout = itemLayouts.current.get(draggedLayoutKey);
        const placeholderH = draggedLayout ? draggedLayout.height : layout.height;
        runOnUI(() => {
          'worklet';
          placeholderHeight.value = withSpring(placeholderH, { damping: 15, stiffness: 300 });
        })();
      }
    } else {
      setDropTarget(null);
      setPlaceholderPosition(null);
      runOnUI(() => {
        'worklet';
        placeholderHeight.value = withSpring(0, { damping: 15, stiffness: 300 });
      })();
    }
  };

  const handleDrop = async (item, target) => {
    // Clear placeholder immediately
    setPlaceholderPosition(null);
    placeholderHeight.value = withSpring(0, { damping: 15, stiffness: 300 });
    
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
      // Preserve expanded state and scroll position
      const currentExpandedEras = new Set(expandedEras);
      const currentExpandedEvents = new Set(expandedEvents);
      const savedScrollY = scrollPositionRef.current;
      
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
      
      // Restore expanded state
      setExpandedEras(currentExpandedEras);
      setExpandedEvents(currentExpandedEvents);
      
      // Restore scroll position after a brief delay to allow layout to complete
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: savedScrollY, animated: false });
        }
      }, 100);
      
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

  // Animated style for dragged item - enhanced popped-out effect with reduced size
  const draggedItemStyle = useAnimatedStyle(() => {
    if (!isDraggingShared.value) {
      return {};
    }
    return {
      transform: [
        { translateX: dragPosition.value.x },
        { translateY: dragPosition.value.y },
        { scale: dragScale.value },
        { scaleX: dragWidthScale.value },
        { scaleY: dragHeightScale.value },
      ],
      opacity: dragOpacity.value,
      zIndex: 9999, // Ensure dragged item is on top
      elevation: 20, // Android elevation
      borderWidth: 3,
      borderColor: '#8B5CF6',
      backgroundColor: 'transparent', // Required for shadow calculation
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.7,
      shadowRadius: 16,
    };
  });

  // Animated style for long press feedback (before drag starts)
  const longPressStyle = useAnimatedStyle(() => {
    if (!isLongPressing) {
      return {};
    }
    return {
      transform: [{ scale: 1.05 }],
      opacity: 0.9,
    };
  });

  // Animated style for placeholder gap
  const placeholderStyle = useAnimatedStyle(() => {
    if (!placeholderPosition) {
      return { opacity: 0, height: 0 };
    }
    // Cap the height to prevent it from being too large
    const maxHeight = screenHeight * 0.4; // Max 40% of screen height
    const height = Math.min(placeholderHeight.value, maxHeight);
    return {
      opacity: 1,
      height: Math.max(0, height), // Ensure non-negative
    };
  });

  const renderEra = (era, index) => {
    const isExpanded = expandedEras.has(era.id);
    const eraEvents = events[era.id] || [];
    const hasEvents = eraEvents.length > 0;
    const imageSource = getImageSource(era.imageUrl);
    const backgroundColor = colors.era || '#8B5CF6';
    const isDragging = draggedItem?.id === era.id;
    const isDropTarget = dropTarget?.id === era.id && dropTarget?.type === 'era' && !isDragging;
    const showPlaceholder = placeholderPosition?.id === era.id && placeholderPosition?.type === 'era' && !isDragging;
    const isLongPressingThis = isLongPressing?.id === era.id && isLongPressing?.type === 'era';
    const isAnyDragInProgress = draggedItem !== null;
    const shouldDarken = isAnyDragInProgress && !isDragging;

    // Create drag gesture for hamburger icon only
    // Use Pan with manual activation - LongPress activates it after 150ms
    // Capture era data before worklet
    const eraId = era.id;
    const eraTitle = era.title;
    const eraStartTime = era.startTime;
    const eraEndTime = era.endTime;
    const eraImageUrl = era.imageUrl;
    const eraDescription = era.description;
    const eraData = { id: eraId, title: eraTitle, startTime: eraStartTime, endTime: eraEndTime, imageUrl: eraImageUrl, description: eraDescription };
    
    const longPress = Gesture.LongPress()
      .minDuration(150)
      .onStart(() => {
        'worklet';
        runOnJS(handleLongPressStart)(eraData, 'era');
        runOnJS(handleStartDrag)(eraData, 'era', null);
      })
      .onEnd(() => {
        'worklet';
        if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      });

    const pan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .enabled(true)
      .onTouchesDown(() => {
        'worklet';
        // Immediate feedback when touch starts
        runOnJS(handleLongPressStart)(eraData, 'era');
      })
      .onTouchesUp(() => {
        'worklet';
        console.log('Pan onTouchesUp called', { isDraggingShared: isDraggingShared.value });
        if (isDraggingShared.value) {
          runOnJS(handleEndDrag)();
        } else if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      })
      .onTouchesCancelled(() => {
        'worklet';
        if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      })
      .onUpdate((event) => {
        'worklet';
        // Only process updates if dragging is enabled (long press completed)
        if (canDrag.value && isDraggingShared.value) {
          // Update position directly on UI thread for smooth animation
          dragPosition.value = {
            x: event.translationX,
            y: event.translationY,
          };
          // Call JS function for drop target detection
          runOnJS(handleDragUpdate)(event);
        }
      })
      .onEnd(() => {
        'worklet';
        console.log('Pan onEnd called', { isDraggingShared: isDraggingShared.value });
        if (isDraggingShared.value) {
          runOnJS(handleEndDrag)();
        }
      });

    // Use Simultaneous so both can run, Pan processes updates when canDrag is true
    const hamburgerGesture = Gesture.Simultaneous(longPress, pan);

    return (
      <View 
        key={era.id} 
        style={styles.eraContainer}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          itemLayouts.current.set(`era-${era.id}`, { type: 'era', id: era.id, y, height });
        }}
      >
        {/* Placeholder gap above */}
        {showPlaceholder && placeholderPosition.position === 'above' && (
          <Animated.View style={[styles.placeholderGap, placeholderStyle]} />
        )}
        
        <Animated.View
          style={[
            styles.eraBar,
            { height: ERA_HEIGHT },
            isDragging && draggedItemStyle,
            isLongPressingThis && longPressStyle,
            isDropTarget && styles.dropTarget,
            shouldDarken && styles.darkenedNode,
          ]}
        >
          {/* Drag icon with drag gesture */}
          <GestureDetector gesture={hamburgerGesture}>
            <View style={styles.dragIconContainer}>
              <Icon source="drag" size={24} color="rgba(255, 255, 255, 0.7)" />
            </View>
          </GestureDetector>
          
          {/* Menu icon */}
          <TouchableOpacity
            style={styles.menuIconContainer}
            onPress={() => setMenuVisible(menuVisible?.id === era.id ? null : { type: 'era', id: era.id })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon source="menu" size={24} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
          
          {/* Menu dropdown */}
          {menuVisible?.id === era.id && menuVisible?.type === 'era' && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(null);
                  if (onItemEdit) {
                    onItemEdit({ _originalData: { type: 'era', data: era } });
                  }
                }}
              >
                <Icon source="pencil" size={20} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(null);
                  if (onItemDelete) {
                    onItemDelete({ _originalData: { type: 'era', data: era } });
                  }
                }}
              >
                <Icon source="delete" size={20} color="#FF5252" />
                <Text style={[styles.menuItemText, { color: '#FF5252' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!isDragging && !menuVisible) {
                toggleEra(era.id);
                if (onItemPress) {
                  onItemPress({ _originalData: { type: 'era', data: era } }, index);
                }
              }
              if (menuVisible) {
                setMenuVisible(null);
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
        
        {/* Placeholder gap below */}
        {showPlaceholder && placeholderPosition.position === 'below' && (
          <Animated.View style={[styles.placeholderGap, placeholderStyle]} />
        )}
        
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
    const isDropTarget = dropTarget?.id === event.id && dropTarget?.type === 'event' && !isDragging;
    const showPlaceholder = placeholderPosition?.id === event.id && placeholderPosition?.type === 'event' && !isDragging;
    const isLongPressingThis = isLongPressing?.id === event.id && isLongPressing?.type === 'event';
    const isAnyDragInProgress = draggedItem !== null;
    const shouldDarken = isAnyDragInProgress && !isDragging;

    // Create drag gesture for hamburger icon only
    // Capture event data before worklet
    const eventId = event.id;
    const eventTitle = event.title;
    const eventTime = event.time;
    const eventImageUrl = event.imageUrl;
    const eventDescription = event.description;
    const eventData = { id: eventId, title: eventTitle, time: eventTime, imageUrl: eventImageUrl, description: eventDescription };
    
    const longPress = Gesture.LongPress()
      .minDuration(150)
      .onStart(() => {
        'worklet';
        runOnJS(handleLongPressStart)(eventData, 'event');
        runOnJS(handleStartDrag)(eventData, 'event', eraId);
      })
      .onEnd(() => {
        'worklet';
        if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      });

    const pan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .enabled(true)
      .onTouchesDown(() => {
        'worklet';
        runOnJS(handleLongPressStart)(eventData, 'event');
      })
      .onTouchesUp(() => {
        'worklet';
        console.log('Pan onTouchesUp called', { isDraggingShared: isDraggingShared.value });
        if (isDraggingShared.value) {
          runOnJS(handleEndDrag)();
        } else if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      })
      .onTouchesCancelled(() => {
        'worklet';
        if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      })
      .onUpdate((event) => {
        'worklet';
        // Only process updates if dragging is enabled (long press completed)
        if (canDrag.value && isDraggingShared.value) {
          // Update position directly on UI thread for smooth animation
          dragPosition.value = {
            x: event.translationX,
            y: event.translationY,
          };
          // Call JS function for drop target detection
          runOnJS(handleDragUpdate)(event);
        }
      })
      .onEnd(() => {
        'worklet';
        console.log('Pan onEnd called', { isDraggingShared: isDraggingShared.value });
        if (isDraggingShared.value) {
          runOnJS(handleEndDrag)();
        }
      });

    const hamburgerGesture = Gesture.Simultaneous(longPress, pan);

    return (
      <View 
        key={event.id} 
        style={styles.eventContainer}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          itemLayouts.current.set(`event-${event.id}`, { type: 'event', id: event.id, y, height });
        }}
      >
        {/* Placeholder gap above */}
        {showPlaceholder && placeholderPosition.position === 'above' && (
          <Animated.View style={[styles.placeholderGap, placeholderStyle]} />
        )}
        
        <Animated.View
          style={[
            styles.eventBar,
            { height: EVENT_HEIGHT },
            isDragging && draggedItemStyle,
            isLongPressingThis && longPressStyle,
            isDropTarget && styles.dropTarget,
            shouldDarken && styles.darkenedNode,
            isDragging && { opacity: 0.3 }, // Make original node semi-transparent when dragging
          ]}
        >
          {/* Drag icon with drag gesture */}
          <GestureDetector gesture={hamburgerGesture}>
            <View style={styles.dragIconContainer}>
              <Icon source="drag" size={24} color="rgba(255, 255, 255, 0.7)" />
            </View>
          </GestureDetector>
          
          {/* Menu icon */}
          <TouchableOpacity
            style={styles.menuIconContainer}
            onPress={() => setMenuVisible(menuVisible?.id === event.id ? null : { type: 'event', id: event.id })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon source="menu" size={24} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
          
          {/* Menu dropdown */}
          {menuVisible?.id === event.id && menuVisible?.type === 'event' && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(null);
                  if (onItemEdit) {
                    onItemEdit({ _originalData: { type: 'event', data: event } });
                  }
                }}
              >
                <Icon source="pencil" size={20} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(null);
                  if (onItemDelete) {
                    onItemDelete({ _originalData: { type: 'event', data: event } });
                  }
                }}
              >
                <Icon source="delete" size={20} color="#FF5252" />
                <Text style={[styles.menuItemText, { color: '#FF5252' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!isDragging && !menuVisible) {
                toggleEvent(event.id);
                if (onItemPress) {
                  onItemPress({ _originalData: { type: 'event', data: event } }, index);
                }
              }
              if (menuVisible) {
                setMenuVisible(null);
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
        
        {/* Placeholder gap below */}
        {showPlaceholder && placeholderPosition.position === 'below' && (
          <Animated.View style={[styles.placeholderGap, placeholderStyle]} />
        )}
        
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
    const isDropTarget = dropTarget?.id === scene.id && dropTarget?.type === 'scene' && !isDragging;
    const showPlaceholder = placeholderPosition?.id === scene.id && placeholderPosition?.type === 'scene' && !isDragging;
    const isLongPressingThis = isLongPressing?.id === scene.id && isLongPressing?.type === 'scene';
    const isAnyDragInProgress = draggedItem !== null;
    const shouldDarken = isAnyDragInProgress && !isDragging;

    // Create drag gesture for hamburger icon only
    // Capture scene data before worklet
    const sceneId = scene.id;
    const sceneTitle = scene.title;
    const sceneTime = scene.time;
    const sceneImageUrl = scene.imageUrl;
    const sceneDescription = scene.description;
    const sceneData = { id: sceneId, title: sceneTitle, time: sceneTime, imageUrl: sceneImageUrl, description: sceneDescription };
    
    const longPress = Gesture.LongPress()
      .minDuration(150)
      .onStart(() => {
        'worklet';
        runOnJS(handleLongPressStart)(sceneData, 'scene');
        runOnJS(handleStartDrag)(sceneData, 'scene', eventId);
      })
      .onEnd(() => {
        'worklet';
        if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      });

    const pan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .enabled(true)
      .onTouchesDown(() => {
        'worklet';
        runOnJS(handleLongPressStart)(sceneData, 'scene');
      })
      .onTouchesMove((event, state) => {
        'worklet';
        // No activation needed - we check canDrag in onUpdate
      })
      .onTouchesUp(() => {
        'worklet';
        console.log('Pan onTouchesUp called', { isDraggingShared: isDraggingShared.value });
        if (isDraggingShared.value) {
          runOnJS(handleEndDrag)();
        } else if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      })
      .onTouchesCancelled(() => {
        'worklet';
        if (!isDraggingRef.current) {
          runOnJS(handleLongPressEnd)();
        }
      })
      .onUpdate((event) => {
        'worklet';
        // Only process updates if dragging is enabled (long press completed)
        if (canDrag.value && isDraggingShared.value) {
          // Update position directly on UI thread for smooth animation
          dragPosition.value = {
            x: event.translationX,
            y: event.translationY,
          };
          // Call JS function for drop target detection
          runOnJS(handleDragUpdate)(event);
        }
      })
      .onEnd(() => {
        'worklet';
        console.log('Pan onEnd called', { isDraggingShared: isDraggingShared.value });
        if (isDraggingShared.value) {
          runOnJS(handleEndDrag)();
        }
      });

    const hamburgerGesture = Gesture.Simultaneous(longPress, pan);

    return (
      <View
        key={scene.id}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          itemLayouts.current.set(`scene-${scene.id}`, { type: 'scene', id: scene.id, y, height });
        }}
      >
        {/* Placeholder gap above */}
        {showPlaceholder && placeholderPosition.position === 'above' && (
          <Animated.View style={[styles.placeholderGap, placeholderStyle]} />
        )}
        
        <Animated.View
          style={[
            styles.sceneBar,
            { height: SCENE_HEIGHT },
            isDragging && draggedItemStyle,
            isLongPressingThis && longPressStyle,
            isDropTarget && styles.dropTarget,
            shouldDarken && styles.darkenedNode,
            isDragging && { opacity: 0.3 }, // Make original node semi-transparent when dragging
          ]}
        >
          {/* Drag icon with drag gesture */}
          <GestureDetector gesture={hamburgerGesture}>
            <View style={styles.dragIconContainer}>
              <Icon source="drag" size={24} color="rgba(255, 255, 255, 0.7)" />
            </View>
          </GestureDetector>
          
          {/* Menu icon */}
          <TouchableOpacity
            style={styles.menuIconContainer}
            onPress={() => setMenuVisible(menuVisible?.id === scene.id ? null : { type: 'scene', id: scene.id })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon source="menu" size={24} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
          
          {/* Menu dropdown */}
          {menuVisible?.id === scene.id && menuVisible?.type === 'scene' && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(null);
                  if (onItemEdit) {
                    onItemEdit({ _originalData: { type: 'scene', data: scene } });
                  }
                }}
              >
                <Icon source="pencil" size={20} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(null);
                  if (onItemDelete) {
                    onItemDelete({ _originalData: { type: 'scene', data: scene } });
                  }
                }}
              >
                <Icon source="delete" size={20} color="#FF5252" />
                <Text style={[styles.menuItemText, { color: '#FF5252' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!isDragging && !menuVisible) {
                if (onItemPress) {
                  onItemPress({ _originalData: { type: 'scene', data: scene } }, index);
                }
              }
              if (menuVisible) {
                setMenuVisible(null);
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
        
        {/* Placeholder gap below */}
        {showPlaceholder && placeholderPosition.position === 'below' && (
          <Animated.View style={[styles.placeholderGap, placeholderStyle]} />
        )}
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
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      onScroll={(event) => {
        scrollPositionRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
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
    backgroundColor: 'transparent', // Required for shadow calculation
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
    backgroundColor: 'transparent', // Required for shadow calculation
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
    backgroundColor: 'transparent', // Required for shadow calculation
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
    paddingLeft: 60, // Add padding to account for hamburger icon (50px width + 10px spacing)
  },
  barTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 8, // Additional padding for text spacing
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
  dragIconContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingLeft: 8,
  },
  menuIconContainer: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  menuDropdown: {
    position: 'absolute',
    right: 16,
    top: 60,
    backgroundColor: '#2A2A3E',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderGap: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    marginVertical: 2,
  },
  darkenedNode: {
    opacity: 0.4,
  },
});

export default BasicView;

