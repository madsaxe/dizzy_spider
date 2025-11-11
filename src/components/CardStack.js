import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import HexagonNode, { HEXAGON_SIZE } from './HexagonNode';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Stack configuration
const STACK_OFFSET = 15; // Offset between stacked nodes (down and right)
const MAX_STACK_DEPTH = 5; // Maximum number of visible stacked nodes
const EXPANDED_VERTICAL_SPACING = 20; // Spacing between expanded nodes (vertical)
const EXPANDED_HORIZONTAL_SPACING = 20; // Spacing between expanded nodes (horizontal)

// Styles need to be defined before components that use them
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  horizontalScrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  horizontalContentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: screenHeight * 0.5, // Ensure minimum height for vertical centering
  },
  itemContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalItem: {
    width: '100%',
    alignItems: 'center',
  },
  horizontalItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Prevent items from shrinking in horizontal layout
  },
  stackedNodesWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  mainNodeContainer: {
    position: 'relative',
  },
  stackedNodeContainer: {
    position: 'absolute',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    backgroundColor: '#16213E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    opacity: 0.5,
  },
  emptyCardContent: {
    padding: 16,
    minHeight: 200,
  },
  emptyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
  },
  emptyCardTitle: {
    height: 24,
    backgroundColor: '#2A2A3E',
    borderRadius: 4,
    marginBottom: 12,
    width: '70%',
  },
  emptyCardDescription: {
    height: 16,
    backgroundColor: '#2A2A3E',
    borderRadius: 4,
    marginBottom: 8,
    width: '100%',
  },
  emptyCardDescriptionShort: {
    height: 16,
    backgroundColor: '#2A2A3E',
    borderRadius: 4,
    width: '60%',
  },
});

// Animated Item Component - separate component so hooks can be called at top level
// Each item creates its own shared values at the top level
const AnimatedHexagonItem = ({
  item,
  itemId,
  index,
  itemType,
  itemData,
  childCount,
  stackPadding,
  itemSpacing,
  isHorizontalLayout,
  isVerticalLayout,
  zoomLevel,
  sharedValuesRef, // Ref to store shared values map
  formattedItem,
  onItemPress,
  onItemEdit,
  colors,
  showImages,
  fontSizes,
  renderStackedNodes,
}) => {
  // Create shared values for each item component instance at the top level
  // These are created unconditionally to follow React hook rules
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  
  // Store in ref for parent to access (ensure sharedValuesRef exists and has current)
  useEffect(() => {
    if (!itemId) return;
    if (!sharedValuesRef) return;
    
    // Initialize current if it doesn't exist or isn't an object
    if (!sharedValuesRef.current) {
      sharedValuesRef.current = {};
    } else if (typeof sharedValuesRef.current !== 'object') {
      sharedValuesRef.current = {};
    }
    
    // Store shared values
    sharedValuesRef.current[itemId] = {
      translateX,
      translateY,
      opacity,
      scale,
    };
  }, [itemId, translateX, translateY, opacity, scale, sharedValuesRef]);
  
  // Create animated style at the top level of this component
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  }, [translateX, translateY, opacity, scale]);

  return (
    <Animated.View
      style={[
        isHorizontalLayout ? styles.horizontalItem : styles.verticalItem,
        animatedStyle,
        {
          marginRight: isHorizontalLayout ? itemSpacing : 0,
          marginBottom: isVerticalLayout ? itemSpacing : 0,
        },
      ]}
    >
      <View style={styles.itemContainer}>
        {/* Stacked nodes container (if item has children and at eras level) */}
        {stackPadding > 0 && (
          <View style={[styles.stackedNodesWrapper, { 
            width: HEXAGON_SIZE + stackPadding + 10,
            height: HEXAGON_SIZE + stackPadding + 10,
          }]}>
            {renderStackedNodes && renderStackedNodes(item, itemType, itemData, childCount)}
          </View>
        )}

        {/* Main node */}
        <View 
          style={[
            styles.mainNodeContainer,
            stackPadding > 0 && { zIndex: MAX_STACK_DEPTH + 1 },
          ]}
        >
          <HexagonNode
            item={formattedItem}
            onPress={() => onItemPress && onItemPress(item, index)}
            onEdit={onItemEdit ? () => onItemEdit(item) : undefined}
            colors={colors}
            showImage={showImages}
            fontSizes={fontSizes}
            zoomLevel={zoomLevel}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const CardStack = ({
  data = [],
  onItemPress,
  onItemEdit,
  colors = {},
  showImages = true,
  fontSizes = { title: 16, description: 14, time: 12 },
  onRefresh,
  refreshing = false,
  events = {},
  scenes = {},
  zoomLevel = 'eras',
  selectedEraId = null,
  selectedEventId = null,
}) => {
  // Store shared values in a ref - items will create their own shared values
  // and register them in this ref so parent can access them for animations
  const sharedValuesRef = useRef({});

  const [isInitialMount, setIsInitialMount] = useState(true);
  const prevZoomLevel = useRef(zoomLevel);
  const prevDataLength = useRef(data.length);

  // Trigger entrance animations when zoom level changes or new items appear
  useEffect(() => {
    const zoomChanged = prevZoomLevel.current !== zoomLevel;
    const dataChanged = prevDataLength.current !== data.length;
    
    // Only animate if zoom changed (drilling in/out) or if this is initial mount
    if (zoomChanged || isInitialMount) {
      setIsInitialMount(false);
      
      // Small delay to ensure data has updated
      const animationDelay = zoomChanged ? 50 : 0;
      
      setTimeout(() => {
        // Animate items entering based on zoom level
        data.forEach((item, index) => {
          const originalData = item._originalData || item;
          const itemData = originalData.data || originalData;
          const itemId = itemData.id || item.id || `item-${index}`;
          if (!itemId) return;
          
          // Get shared values for this item from the ref (created by child component)
          const animValues = sharedValuesRef.current?.[itemId];
          if (!animValues) return; // Skip if values don't exist yet
          
          // Determine initial position based on zoom level
          if (zoomLevel === 'events' && zoomChanged) {
            // Events: start from stacked position (offset down and right), animate to vertical position
            // Simulate unstacking: items start from a stacked position and spread vertically
            const stackedOffset = Math.min(index, MAX_STACK_DEPTH - 1) * STACK_OFFSET;
            const initialX = stackedOffset;
            const initialY = -HEXAGON_SIZE * 0.3; // Start slightly above final position to simulate unstacking
            
            // Set initial values immediately
            animValues.translateX.value = initialX;
            animValues.translateY.value = initialY;
            animValues.opacity.value = 0.5;
            animValues.scale.value = 0.9;
            
            // Small delay to ensure initial values are set, then animate
            setTimeout(() => {
              // Animate to final vertical position (spread out vertically)
              animValues.translateX.value = withTiming(0, {
                duration: 600,
                easing: Easing.out(Easing.ease),
              });
              animValues.translateY.value = withTiming(0, {
                duration: 600,
                easing: Easing.out(Easing.ease),
              });
              animValues.opacity.value = withTiming(1, {
                duration: 600,
                easing: Easing.out(Easing.ease),
              });
              animValues.scale.value = withTiming(1, {
                duration: 600,
                easing: Easing.out(Easing.ease),
              });
            }, 10);
          } else if (zoomLevel === 'scenes' && zoomChanged) {
            // Scenes: start from stacked position, animate to horizontal position (to the right)
            // Simulate expanding to the right
            const stackedOffset = Math.min(index, MAX_STACK_DEPTH - 1) * STACK_OFFSET;
            const initialX = -HEXAGON_SIZE * 0.4; // Start from left (stacked position)
            const initialY = stackedOffset * 0.6;
            
            // Set initial values immediately
            animValues.translateX.value = initialX;
            animValues.translateY.value = initialY;
            animValues.opacity.value = 0.5;
            animValues.scale.value = 0.9;
            
            // Small delay to ensure initial values are set, then animate
            setTimeout(() => {
              // Animate to final horizontal position (spread out horizontally to the right)
              animValues.translateX.value = withTiming(0, {
                duration: 600,
                easing: Easing.out(Easing.ease),
              });
              animValues.translateY.value = withTiming(0, {
                duration: 600,
                easing: Easing.out(Easing.ease),
              });
              animValues.opacity.value = withTiming(1, {
                duration: 600,
                easing: Easing.out(Easing.ease),
              });
              animValues.scale.value = withTiming(1, {
                duration: 600,
                easing: Easing.out(Easing.ease),
              });
            }, 10);
          } else if (zoomLevel === 'eras') {
            // Eras: normal entrance animation (fade in with slight scale)
            if (isInitialMount || zoomChanged) {
              // Set initial values
              animValues.opacity.value = 0;
              animValues.scale.value = 0.95;
              animValues.translateX.value = 0;
              animValues.translateY.value = 0;
              
              // Animate to final state
              setTimeout(() => {
                animValues.opacity.value = withTiming(1, {
                  duration: 400,
                  easing: Easing.out(Easing.ease),
                });
                animValues.scale.value = withTiming(1, {
                  duration: 400,
                  easing: Easing.out(Easing.ease),
                });
              }, 10);
            }
          } else {
            // Default: ensure items are visible immediately
            animValues.opacity.value = 1;
            animValues.scale.value = 1;
            animValues.translateX.value = 0;
            animValues.translateY.value = 0;
          }
        });
      }, animationDelay);
      
      prevZoomLevel.current = zoomLevel;
      prevDataLength.current = data.length;
    }
  }, [zoomLevel, data, isInitialMount, sharedValuesRef]);

  // Calculate child count for an item
  const getChildCount = (item, itemType, itemData) => {
    if (itemType === 'era' && zoomLevel === 'eras') {
      const eraEvents = events[itemData.id] || [];
      return eraEvents.length;
    } else if (itemType === 'event' && zoomLevel === 'events') {
      const eventScenes = scenes[itemData.id] || [];
      return eventScenes.length;
    }
    return 0;
  };

  // Get child items for an item
  const getChildItems = (item, itemType, itemData) => {
    if (itemType === 'era' && zoomLevel === 'eras') {
      return events[itemData.id] || [];
    } else if (itemType === 'event' && zoomLevel === 'events') {
      return scenes[itemData.id] || [];
    }
    return [];
  };

  // Calculate position for stacked nodes
  const getStackedPosition = (stackIndex) => {
    const offsetX = stackIndex * STACK_OFFSET;
    const offsetY = stackIndex * STACK_OFFSET;
    return { x: offsetX, y: offsetY };
  };

  // Render stacked nodes for an item (up to 5 visible)
  const renderStackedNodes = useCallback((item, itemType, itemData, childCount) => {
    if (childCount === 0 || zoomLevel !== 'eras') return null; // Only show stacks at eras level

    const visibleStackCount = Math.min(childCount, MAX_STACK_DEPTH);
    const childItems = getChildItems(item, itemType, itemData);
    if (childItems.length === 0) return null;

    return (
      <>
        {Array.from({ length: visibleStackCount }).map((_, stackIndex) => {
          const reverseIndex = visibleStackCount - stackIndex - 1;
          const position = getStackedPosition(reverseIndex);
          const opacity = Math.max(0.5 - (reverseIndex * 0.1), 0.2);

          // Use actual child item data for stacked nodes (showing actual content)
          const childItem = childItems[reverseIndex];
          if (!childItem) return null;

          const childType = itemType === 'era' ? 'event' : 'scene';
          const formattedChildItem = {
            id: childItem.id,
            title: childItem.title,
            description: childItem.description,
            time: childItem.timeDisplay || childItem.time,
            type: childType,
            imageUrl: childItem.imageUrl,
          };

          return (
            <View
              key={`stack-${itemData.id}-${stackIndex}`}
              style={[
                styles.stackedNodeContainer,
                {
                  position: 'absolute',
                  top: position.y,
                  left: position.x,
                  opacity,
                  zIndex: stackIndex + 1,
                },
              ]}
              pointerEvents="none"
            >
              <HexagonNode
                item={formattedChildItem}
                colors={colors}
                showImage={showImages}
                fontSizes={fontSizes}
                zoomLevel={zoomLevel}
              />
            </View>
          );
        })}
      </>
    );
  }, [zoomLevel, events, scenes, colors, showImages, fontSizes, getChildItems]);

  // Format item for HexagonNode
  const formatItem = (item) => {
    const originalData = item._originalData || item;
    const itemData = originalData.data || originalData;
    const itemType = originalData.type || item.type;

    return {
      id: item.id || itemData.id,
      title: item.title || itemData?.title,
      description: item.description || itemData?.description,
      time: item.time || itemData?.timeDisplay || itemData?.time,
      type: itemType,
      imageUrl: item.imageUrl || itemData?.imageUrl,
    };
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyCardContent}>
            <View style={styles.emptyCardHeader}>
              <View style={styles.emptyCardIcon} />
            </View>
            <View style={styles.emptyCardTitle} />
            <View style={styles.emptyCardDescription} />
            <View style={styles.emptyCardDescriptionShort} />
          </View>
        </View>
      </View>
    );
  }

  // Determine layout based on zoom level
  const isHorizontalLayout = zoomLevel === 'scenes';
  const isVerticalLayout = zoomLevel === 'events';

  // Render items based on layout
  const renderItems = () => {
    return data.map((item, index) => {
      const originalData = item._originalData || item;
      const itemData = originalData.data || originalData;
      const itemType = originalData.type || item.type;
      const childCount = getChildCount(item, itemType, itemData);
      const itemId = itemData.id || item.id || `item-${index}`;

      const formattedItem = formatItem(item);

      // Calculate stack padding for items with children (only at eras level)
      const stackPadding = (childCount > 0 && zoomLevel === 'eras') 
        ? (Math.min(childCount, MAX_STACK_DEPTH) * STACK_OFFSET) 
        : 0;

      // Calculate spacing for expanded layouts
      const itemSpacing = isHorizontalLayout 
        ? EXPANDED_HORIZONTAL_SPACING 
        : EXPANDED_VERTICAL_SPACING;

      return (
        <AnimatedHexagonItem
          key={itemId}
          item={item}
          itemId={itemId}
          index={index}
          itemType={itemType}
          itemData={itemData}
          childCount={childCount}
          stackPadding={stackPadding}
          itemSpacing={itemSpacing}
          isHorizontalLayout={isHorizontalLayout}
          isVerticalLayout={isVerticalLayout}
          zoomLevel={zoomLevel}
          sharedValuesRef={sharedValuesRef}
          formattedItem={formattedItem}
          onItemPress={onItemPress}
          onItemEdit={onItemEdit}
          colors={colors}
          showImages={showImages}
          fontSizes={fontSizes}
          renderStackedNodes={renderStackedNodes}
        />
      );
    });
  };

  // Use horizontal ScrollView for scenes, vertical for events/eras
  if (isHorizontalLayout) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScrollView}
          contentContainerStyle={styles.horizontalContentContainer}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {renderItems()}
        </ScrollView>
      </View>
    );
  }

  // Vertical layout for eras and events
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
      {renderItems()}
    </ScrollView>
  );
};

export default CardStack;
