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
} from 'react-native-reanimated';
import HexagonNode, { HEXAGON_SIZE } from './HexagonNode';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Stack configuration
const STACK_OFFSET = 4; // Offset between stacked nodes (down and right) - reduced to 6px
const MAX_STACK_DEPTH = 6 // Maximum number of visible stacked nodes
const EXPANDED_VERTICAL_SPACING = -30; // Spacing between expanded nodes (vertical) - 5pt for scenes
const EXPANDED_HORIZONTAL_SPACING = -50; // Spacing between expanded nodes (horizontal) - initial gap + spacing between events
const ERA_CARDSTACK_SPACING = -30; // Spacing between Era cardstacks (vertical)
const EVENT_STAGGER_VERTICAL_OFFSET = HEXAGON_SIZE / 2;// Vertical offset for every other Event (even indices)
// Clipping offset based on hexagon clipping shape width (approximately 5% of hexagon size)
const CLIPPING_OFFSET = HEXAGON_SIZE * 0.05;

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
    alignItems: 'flex-start', // Align Eras to the left, canvas expands to the right for Events
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
    alignItems: 'flex-start', // Align hexagon nodes to the left
    justifyContent: 'flex-start',
  },
  verticalItem: {
    width: '100%',
    alignItems: 'flex-start', // Align Era nodes to the left
    position: 'relative', // Enable absolute positioning for Events/Scenes
    // Ensure Era nodes don't expand when children are added
    alignSelf: 'flex-start', // Prevent stretching
    minHeight: HEXAGON_SIZE, // Fixed minimum height to prevent position changes
    height: HEXAGON_SIZE, // Fixed height so Eras don't move when Events expand
  },
  horizontalItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Prevent items from shrinking in horizontal layout
    position: 'absolute', // Events positioned absolutely to the right of Era
  },
  sceneItem: {
    position: 'absolute', // Scenes positioned absolutely below Event
    alignItems: 'center',
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
  parentPositionsRef, // Ref to store parent positions
  parentId, // ID of parent node (for Events: eraId, for Scenes: eventId)
  formattedItem,
  onItemPress,
  onItemEdit,
  colors,
  showImages,
  fontSizes,
  renderStackedNodes,
  allData, // All data items for calculating parent positions
  selectedEraId, // Selected era ID for filtering (backward compatibility)
  selectedEraIds, // Set of selected era IDs
  selectedEventId, // Selected event ID for filtering (backward compatibility)
  selectedEventIds, // Set of selected event IDs
  positionsUpdateKey, // Key to force re-render when positions change
  breadcrumbNodeIds, // Nodes in current breadcrumb path for opacity styling
  selectionOrder, // Map of nodeId -> timestamp for z-index ordering
}) => {
  // Create shared values for each item component instance at the top level
  // Simplified: no animations, just static positioning
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
  // For Events/Scenes with absolute positioning, we don't need transforms
  const needsTransform = !((zoomLevel === 'events' || zoomLevel === 'scenes') && (itemType === 'event' || itemType === 'scene') && parentId);
  
  const animatedStyle = useAnimatedStyle(() => {
    if (needsTransform) {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        opacity: opacity.value,
      };
    } else {
      // For absolutely positioned Events/Scenes, only apply opacity and scale
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
      };
    }
  }, [translateX, translateY, opacity, scale, needsTransform]);

  // Handle layout measurement to track parent positions
  // For Eras, measure the container but use HEXAGON_SIZE for width (not measured width)
  // For Events/Scenes, measure normally
  const handleLayout = useCallback((event) => {
    if (!itemId) return;
    
    const { x, y, width, height } = event.nativeEvent.layout;
    
    // Store this node's position (it may be a parent for child nodes)
    if (parentPositionsRef && parentPositionsRef.current) {
      if (itemType === 'era') {
        // For Eras, use the measured x,y but use HEXAGON_SIZE for width/height
        // This ensures Events position correctly even when container expands
        parentPositionsRef.current[itemId] = { 
          x, 
          y, 
          width: HEXAGON_SIZE, // Use actual hexagon size, not container width
          height: HEXAGON_SIZE 
        };
        console.log(`[Layout] Era ${itemId} positioned at:`, { 
          x, 
          y, 
          width: HEXAGON_SIZE, 
          height: HEXAGON_SIZE,
          measuredWidth: width,
          measuredHeight: height,
        });
      } else {
        // For Events/Scenes, use measured dimensions
        parentPositionsRef.current[itemId] = { x, y, width, height };
      }
    }
  }, [itemId, parentPositionsRef, itemType]);

  // Determine style based on zoom level and item type for H-shape
  // Simplified: calculate final positions directly, no animations
  // IMPORTANT: Eras should NEVER be absolutely positioned - they stay in normal flow
  const { containerStyle, absolutePosition, finalTranslateX, finalTranslateY } = useMemo(() => {
    let containerStyle = styles.verticalItem;
    let absolutePosition = {};
    let finalTranslateX = 0;
    let finalTranslateY = 0;
    
    // Eras always use normal flow positioning (never absolute)
    if (itemType === 'era') {
      return { containerStyle: styles.verticalItem, absolutePosition: {}, finalTranslateX: 0, finalTranslateY: 0 };
    }
    
    // Events: absolute positioning to the right of Era (when at events or scenes level)
    if ((zoomLevel === 'events' || zoomLevel === 'scenes') && itemType === 'event' && parentId) {
      containerStyle = styles.horizontalItem;
      const parentPosition = parentPositionsRef?.current?.[parentId];
      if (parentPosition && allData) {
        // Find this Event's index among all Events for the same Era
        const eraEvents = allData.filter(d => {
          const dOriginal = d._originalData || d;
          const dData = dOriginal.data || dOriginal;
          const dType = dOriginal.type || d.type;
          const dEraId = d.eraId || dData.eraId;
          return dType === 'event' && dEraId === parentId;
        });
        const eventIndex = eraEvents.findIndex(d => {
          const dOriginal = d._originalData || d;
          const dData = dOriginal.data || dOriginal;
          return (dData.id || d.id) === itemId;
        });
        
        if (eventIndex >= 0) {
          // Calculate staggered positioning for Events
          // Even indices (0, 2, 4...): down by half hexagon height
          // Odd indices (1, 3, 5...): at same height as parent
          // Events should overlap by clipping triangle width, so spacing = HEXAGON_SIZE - CLIPPING_OFFSET
          const eraRightEdge = parentPosition.x + HEXAGON_SIZE;
          const isEven = eventIndex % 2 === 0;
          const verticalOffset = isEven ? EVENT_STAGGER_VERTICAL_OFFSET : 0; // First child (index 0) is lower
          // Each event overlaps the previous by CLIPPING_OFFSET
          // EXPANDED_HORIZONTAL_SPACING controls the initial gap and spacing between events
          // To maintain overlap, spacing = HEXAGON_SIZE - CLIPPING_OFFSET
          // But we can add EXPANDED_HORIZONTAL_SPACING to increase spacing (reducing overlap)
          const horizontalSpacing = HEXAGON_SIZE - CLIPPING_OFFSET + EXPANDED_HORIZONTAL_SPACING;
          const finalX = eraRightEdge + EXPANDED_HORIZONTAL_SPACING + (eventIndex * horizontalSpacing);
          const finalY = parentPosition.y + verticalOffset;
          
          console.log(`[Event Positioning] Event ${eventIndex}:`, {
            eraLeft: parentPosition.x,
            eraWidth: parentPosition.width,
            eraRight: eraRightEdge,
            finalX,
            finalY,
            isEven,
            verticalOffset,
            horizontalSpacing,
            clippingOffset: CLIPPING_OFFSET,
            expandedHorizontalSpacing: EXPANDED_HORIZONTAL_SPACING,
            hexagonSize: HEXAGON_SIZE,
          });
          
          // Position Events absolutely at calculated position (no translateX needed)
          absolutePosition = {
            position: 'absolute',
            left: finalX, // Direct position from Era's right edge with staggered offset
            top: finalY, // Staggered vertical position for odd indices
            width: HEXAGON_SIZE,
          };
          finalTranslateX = 0; // No translation needed, position is set directly
        }
      } else {
        // If parent position not measured yet, use relative positioning
        absolutePosition = {
          position: 'relative',
        };
      }
    } else if (zoomLevel === 'scenes' && itemType === 'scene' && parentId) {
      // Scenes: absolute positioning below Event
      containerStyle = styles.sceneItem;
      const parentPosition = parentPositionsRef?.current?.[parentId];
      if (parentPosition && allData) {
        // parentPosition is the Event's measured position (already at its final X position)
        // Use it directly - no need to recalculate
        const eventFinalX = parentPosition.x;
        
        // Find this Scene's index among all Scenes for the same Event
        const eventScenes = allData.filter(d => {
          const dOriginal = d._originalData || d;
          const dData = dOriginal.data || dOriginal;
          const dType = dOriginal.type || d.type;
          const dEventId = d.eventId || dData.eventId;
          return dType === 'scene' && dEventId === parentId;
        });
        const sceneIndex = eventScenes.findIndex(d => {
          const dOriginal = d._originalData || d;
          const dData = dOriginal.data || dOriginal;
          return (dData.id || d.id) === itemId;
        });
        
        if (sceneIndex >= 0) {
          // Calculate final Y position directly: Event's bottom edge + spacing + (index * spacing)
          // Event's bottom edge = parentPosition.y + HEXAGON_SIZE
          // First Scene: Event's bottom edge + spacing
          // Second Scene: Event's bottom edge + spacing + (hexagon + spacing)
          // etc.
          const eventBottomEdge = parentPosition.y + HEXAGON_SIZE;
          // Scenes should be 10pt apart (EXPANDED_VERTICAL_SPACING = 10)
          const finalY = eventBottomEdge + EXPANDED_VERTICAL_SPACING + (sceneIndex * (HEXAGON_SIZE + EXPANDED_VERTICAL_SPACING));
          
          console.log(`[Scene Positioning] Scene ${sceneIndex}:`, {
            eventX: eventFinalX,
            eventTop: parentPosition.y,
            eventBottom: eventBottomEdge,
            finalY,
            spacing: EXPANDED_VERTICAL_SPACING,
            hexagonSize: HEXAGON_SIZE,
          });
          
          // Position Scenes absolutely at calculated position (no translateY needed)
          absolutePosition = {
            position: 'absolute',
            left: eventFinalX, // Same X as parent Event (already at final position)
            top: finalY, // Direct position below Event
            width: HEXAGON_SIZE,
          };
          finalTranslateY = 0; // No translation needed, position is set directly
        }
      } else {
        // If parent position not measured yet, use relative positioning
        absolutePosition = {
          position: 'relative',
        };
      }
    }
    
    return { containerStyle, absolutePosition, finalTranslateX, finalTranslateY };
  }, [zoomLevel, itemType, parentId, parentPositionsRef, allData, selectedEraId, selectedEventId, itemId, positionsUpdateKey]);
  
  // Set final positions immediately (no animation)
  // Calculate if node should have darkening overlay based on breadcrumb path
  const isInBreadcrumb = breadcrumbNodeIds && breadcrumbNodeIds.has(itemId);
  const shouldDarken = !isInBreadcrumb; // Darken nodes not in breadcrumb path

  // Calculate z-index based on selection order (most recent = highest z-index)
  // Only nodes in the breadcrumb (focused) get higher z-index
  // This ensures focused nodes appear on top while allowing all nodes to be clickable
  const getZIndex = () => {
    const baseZIndex = 10;
    
    // Only apply higher z-index to nodes in the breadcrumb (focused nodes)
    if (!isInBreadcrumb) {
      return baseZIndex; // Not in breadcrumb, use base z-index
    }
    
    // Node is in breadcrumb, apply z-index based on selection order
    if (!selectionOrder || selectionOrder.size === 0) {
      return baseZIndex + 50; // In breadcrumb but no selection order, slightly higher
    }
    
    // Get all timestamps and sort them
    const sortedTimestamps = Array.from(selectionOrder.values()).sort((a, b) => a - b);
    const nodeTimestamp = selectionOrder.get(itemId);
    
    if (nodeTimestamp === undefined) {
      return baseZIndex + 50; // In breadcrumb but not in selection order, slightly higher
    }
    
    // Find index in sorted array (0 = oldest, length-1 = newest)
    const orderIndex = sortedTimestamps.indexOf(nodeTimestamp);
    // Most recent gets highest z-index (base + 50 + orderIndex)
    // This ensures recently selected nodes appear above older ones
    return baseZIndex + 50 + orderIndex;
  };

  const calculatedZIndex = getZIndex();

  useEffect(() => {
    translateX.value = finalTranslateX;
    translateY.value = finalTranslateY;
    opacity.value = 1;
    scale.value = 1;
  }, [finalTranslateX, finalTranslateY, translateX, translateY, opacity, scale]);

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        containerStyle,
        absolutePosition,
        animatedStyle,
        {
          marginRight: isHorizontalLayout ? itemSpacing : 0,
          marginBottom: (zoomLevel === 'eras' && itemType === 'era') ? itemSpacing : (isVerticalLayout && itemSpacing ? itemSpacing : 0),
          zIndex: calculatedZIndex, // Apply z-index based on selection order
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
            {renderStackedNodes && (() => {
              const isSelected = itemType === 'era' 
                ? selectedEraIds.has(itemId)
                : itemType === 'event'
                ? selectedEventIds.has(itemId)
                : false;
              return renderStackedNodes(item, itemType, itemData, childCount, isSelected);
            })()}
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
            shouldDarken={shouldDarken}
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
  selectedEraIds = new Set(),
  selectedEventId = null,
  selectedEventIds = new Set(),
  breadcrumbNodeIds = new Set(), // Nodes in current breadcrumb path for opacity styling
  selectionOrder = new Map(), // Map of nodeId -> timestamp for z-index ordering
}) => {
  // Store shared values in a ref - items will create their own shared values
  // and register them in this ref so parent can access them for animations
  const sharedValuesRef = useRef({});
  
  // Store parent node positions for H-shape animations
  // Maps parentId -> { x, y, width, height } relative to ScrollView
  const parentPositionsRef = useRef({});

  const [isInitialMount, setIsInitialMount] = useState(true);
  const prevZoomLevel = useRef(zoomLevel);
  const prevDataLength = useRef(data.length);
  const [parentPositionsReady, setParentPositionsReady] = useState(false);
  const [positionsUpdateKey, setPositionsUpdateKey] = useState(0); // Force re-render when positions change

  // Check if parent positions are ready for current zoom level
  // Use a polling mechanism to check when parent positions become available
  useEffect(() => {
    if (zoomLevel === 'events' && selectedEraIds.size > 0) {
      const checkParentPositions = () => {
        // Check if all selected Eras have their positions measured
        const allPositionsReady = Array.from(selectedEraIds).every(eraId => {
          return parentPositionsRef.current?.[eraId];
        });
        if (allPositionsReady) {
          setParentPositionsReady(true);
          setPositionsUpdateKey(prev => prev + 1); // Force re-render to update Event positions
        } else {
          // Retry after a short delay
          setTimeout(checkParentPositions, 50);
        }
      };
      setParentPositionsReady(false);
      checkParentPositions();
    } else if (zoomLevel === 'scenes' && selectedEventIds.size > 0) {
      const checkParentPositions = () => {
        // Check if all selected Events have their positions measured
        const allPositionsReady = Array.from(selectedEventIds).every(eventId => {
          return parentPositionsRef.current?.[eventId];
        });
        if (allPositionsReady) {
          setParentPositionsReady(true);
          setPositionsUpdateKey(prev => prev + 1); // Force re-render to update Scene positions
        } else {
          // Retry after a short delay
          setTimeout(checkParentPositions, 50);
        }
      };
      setParentPositionsReady(false);
      checkParentPositions();
    } else {
      setParentPositionsReady(true); // No parent needed for eras
    }
  }, [zoomLevel, selectedEraIds, selectedEventIds]);

  // Simplified: just track zoom level changes for logging
  useEffect(() => {
    prevZoomLevel.current = zoomLevel;
    prevDataLength.current = data.length;
    setIsInitialMount(false);
  }, [zoomLevel, data.length]);

  // Calculate child count for an item
  // Always return count regardless of zoom level - stacks should persist unless node is expanded
  const getChildCount = (item, itemType, itemData) => {
    if (itemType === 'era') {
      const eraEvents = events[itemData.id] || [];
      return eraEvents.length;
    } else if (itemType === 'event') {
      const eventScenes = scenes[itemData.id] || [];
      return eventScenes.length;
    }
    return 0;
  };

  // Get child items for an item
  // Always return items regardless of zoom level - needed for stacking display
  const getChildItems = (item, itemType, itemData) => {
    if (itemType === 'era') {
      return events[itemData.id] || [];
    } else if (itemType === 'event') {
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
  const renderStackedNodes = useCallback((item, itemType, itemData, childCount, isSelected) => {
    if (childCount === 0) return null;
    
    // Show stacks for Eras if Era is not selected (regardless of zoom level)
    // Show stacks for Events if Event is not selected (regardless of zoom level)
    // Stacks persist unless that specific node is currently expanded/unstacked
    const shouldShowStack = !isSelected;
    
    if (!shouldShowStack) return null;

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

  // Debug: Log data when it changes
  useEffect(() => {
    console.log('[CardStack] Data changed:', {
      dataLength: data.length,
      zoomLevel,
      selectedEraId,
      selectedEventId,
      eventCount: data.filter(item => {
        const originalData = item._originalData || item;
        return (originalData.type || item.type) === 'event';
      }).length,
      sceneCount: data.filter(item => {
        const originalData = item._originalData || item;
        return (originalData.type || item.type) === 'scene';
      }).length,
    });
  }, [data, zoomLevel, selectedEraIds, selectedEventIds]);

  // Render items based on layout
  const renderItems = () => {
    return data.map((item, index) => {
      const originalData = item._originalData || item;
      const itemData = originalData.data || originalData;
      const itemType = originalData.type || item.type;
      const childCount = getChildCount(item, itemType, itemData);
      const itemId = itemData.id || item.id || `item-${index}`;

      const formattedItem = formatItem(item);

      // Calculate stack padding for items with children
      // Stacks should show for any node with children, regardless of zoom level (unless that specific node is expanded)
      const stackPadding = childCount > 0
        ? (Math.min(childCount, MAX_STACK_DEPTH) * STACK_OFFSET) 
        : 0;

      // Calculate spacing for expanded layouts
      // Use ERA_CARDSTACK_SPACING for Era nodes, otherwise use EXPANDED_VERTICAL_SPACING or EXPANDED_HORIZONTAL_SPACING
      const itemSpacing = itemType === 'era' && zoomLevel === 'eras'
        ? ERA_CARDSTACK_SPACING
        : isHorizontalLayout 
        ? EXPANDED_HORIZONTAL_SPACING 
        : EXPANDED_VERTICAL_SPACING;
      
      // Debug log for Era spacing
      if (itemType === 'era' && zoomLevel === 'eras') {
        console.log(`[Era Spacing] Era ${itemId}: itemSpacing=${itemSpacing}, ERA_CARDSTACK_SPACING=${ERA_CARDSTACK_SPACING}`);
      }

      // Determine parentId for H-shape animations
      let parentId = null;
      if ((zoomLevel === 'events' || zoomLevel === 'scenes') && itemType === 'event') {
        // Events belong to their Era (use eraId from formatted item, fallback to itemData)
        parentId = item.eraId || itemData.eraId || selectedEraId;
        if (itemType === 'event') {
          console.log('[CardStack] Event item:', {
            itemId,
            title: formattedItem.title,
            parentId,
            eraId: item.eraId || itemData.eraId,
            selectedEraId,
            hasParentPosition: !!parentPositionsRef.current?.[parentId],
          });
        }
      } else if (zoomLevel === 'scenes' && itemType === 'scene') {
        // Scenes belong to the selected Event (use eventId from formatted item, fallback to itemData)
        parentId = item.eventId || itemData.eventId || selectedEventId;
      }

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
          parentPositionsRef={parentPositionsRef}
          parentId={parentId}
          formattedItem={formattedItem}
          onItemPress={onItemPress}
          onItemEdit={onItemEdit}
          colors={colors}
          showImages={showImages}
          fontSizes={fontSizes}
          renderStackedNodes={renderStackedNodes}
          allData={data}
          selectedEraId={selectedEraId}
          selectedEraIds={selectedEraIds}
          selectedEventId={selectedEventId}
          selectedEventIds={selectedEventIds}
          positionsUpdateKey={positionsUpdateKey}
          breadcrumbNodeIds={breadcrumbNodeIds}
          selectionOrder={selectionOrder}
        />
      );
    });
  };

  // Calculate container bounds for scrolling
  // Need to find the maximum X and Y positions of all absolutely positioned items
  // Use useMemo to recalculate when data or positions change
  const containerBounds = useMemo(() => {
    let maxX = screenWidth;
    let maxY = screenHeight;
    
    // Count Events and Scenes to estimate bounds if positions aren't measured yet
    const eventCount = data.filter(item => {
      const originalData = item._originalData || item;
      const itemType = originalData.type || item.type;
      return itemType === 'event';
    }).length;
    
    const sceneCount = data.filter(item => {
      const originalData = item._originalData || item;
      const itemType = originalData.type || item.type;
      return itemType === 'scene';
    }).length;
    
    // Estimate bounds based on item counts if positions aren't ready
    if (eventCount > 0 && (zoomLevel === 'events' || zoomLevel === 'scenes')) {
      // Estimate: Events spread horizontally, so width needs to accommodate them
      maxX = Math.max(maxX, screenWidth + (eventCount * (HEXAGON_SIZE + EXPANDED_HORIZONTAL_SPACING)));
    }
    
    if (sceneCount > 0 && zoomLevel === 'scenes') {
      // Estimate: Scenes spread vertically, so height needs to accommodate them
      maxY = Math.max(maxY, screenHeight + (sceneCount * (HEXAGON_SIZE + EXPANDED_VERTICAL_SPACING)));
    }
    
    // Check all items to find maximum bounds (if positions are measured)
    data.forEach((item) => {
      const originalData = item._originalData || item;
      const itemData = originalData.data || originalData;
      const itemType = originalData.type || item.type;
      const itemId = itemData.id || item.id;
      
      // For Events at events/scenes level, calculate final position
      if ((zoomLevel === 'events' || zoomLevel === 'scenes') && itemType === 'event') {
        const parentId = item.eraId || itemData.eraId || selectedEraId;
        const parentPosition = parentPositionsRef.current?.[parentId];
        if (parentPosition) {
          // Find Event index
          const eraEvents = data.filter(d => {
            const dOriginal = d._originalData || d;
            const dData = dOriginal.data || dOriginal;
            const dType = dOriginal.type || d.type;
            const dEraId = d.eraId || dData.eraId || selectedEraId;
            return dType === 'event' && dEraId === parentId;
          });
          const eventIndex = eraEvents.findIndex(d => {
            const dOriginal = d._originalData || d;
            const dData = dOriginal.data || dOriginal;
            return (dData.id || d.id) === itemId;
          });
          
          if (eventIndex >= 0) {
            const finalX = parentPosition.x + HEXAGON_SIZE + EXPANDED_HORIZONTAL_SPACING + (eventIndex * (HEXAGON_SIZE + EXPANDED_HORIZONTAL_SPACING));
            const finalY = parentPosition.y;
            maxX = Math.max(maxX, finalX + HEXAGON_SIZE + 20); // Add padding
            maxY = Math.max(maxY, finalY + HEXAGON_SIZE + 20);
          }
        }
      }
      
      // For Scenes at scenes level, calculate final position
      if (zoomLevel === 'scenes' && itemType === 'scene') {
        const parentId = item.eventId || itemData.eventId || selectedEventId;
        const parentPosition = parentPositionsRef.current?.[parentId];
        if (parentPosition) {
          // Find Event's final X position
          const parentEvent = data.find(d => {
            const dOriginal = d._originalData || d;
            const dData = dOriginal.data || dOriginal;
            return (dData.id || d.id) === parentId;
          });
          
          let eventFinalX = parentPosition.x;
          if (parentEvent) {
            const dOriginal = parentEvent._originalData || parentEvent;
            const dData = dOriginal.data || dOriginal;
            const dType = dOriginal.type || parentEvent.type;
            const eventEraId = parentEvent.eraId || dData.eraId || selectedEraId;
            
            if (dType === 'event' && eventEraId) {
              const eraEvents = data.filter(d => {
                const eOriginal = d._originalData || d;
                const eData = eOriginal.data || eOriginal;
                const eType = eOriginal.type || d.type;
                const eEraId = d.eraId || eData.eraId || selectedEraId;
                return eType === 'event' && eEraId === eventEraId;
              });
              const eventIndex = eraEvents.findIndex(d => {
                const eOriginal = d._originalData || d;
                const eData = eOriginal.data || eOriginal;
                return (eData.id || d.id) === parentId;
              });
              
              if (eventIndex >= 0) {
                eventFinalX = parentPosition.x + HEXAGON_SIZE + EXPANDED_HORIZONTAL_SPACING + (eventIndex * (HEXAGON_SIZE + EXPANDED_HORIZONTAL_SPACING));
              }
            }
          }
          
          // Find Scene index
          const eventScenes = data.filter(d => {
            const dOriginal = d._originalData || d;
            const dData = dOriginal.data || dOriginal;
            const dType = dOriginal.type || d.type;
            const dEventId = d.eventId || dData.eventId || selectedEventId;
            return dType === 'scene' && dEventId === parentId;
          });
          const sceneIndex = eventScenes.findIndex(d => {
            const dOriginal = d._originalData || d;
            const dData = dOriginal.data || dOriginal;
            return (dData.id || d.id) === itemId;
          });
          
          if (sceneIndex >= 0) {
            const finalX = eventFinalX;
            const finalY = parentPosition.y + HEXAGON_SIZE + EXPANDED_VERTICAL_SPACING + (sceneIndex * (HEXAGON_SIZE + EXPANDED_VERTICAL_SPACING));
            maxX = Math.max(maxX, finalX + HEXAGON_SIZE + 20);
            maxY = Math.max(maxY, finalY + HEXAGON_SIZE + 20);
          }
        }
      }
    });
    
    return { width: maxX, height: maxY };
  }, [data, zoomLevel, selectedEraId, selectedEventId, parentPositionsRef]);

  // For H-shape layout, we need absolute positioning for Events and Scenes
  // Use a single ScrollView that contains all levels and expands to fit all items
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        {
          position: 'relative', // Enable absolute positioning for children
          minWidth: containerBounds.width,
          minHeight: containerBounds.height,
        },
      ]}
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
