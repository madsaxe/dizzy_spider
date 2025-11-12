import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import TimelineItem from './TimelineItem';

const AlternatingTimeline = forwardRef(({
  data = [],
  onItemPress,
  onItemEdit,
  onRefresh,
  refreshing = false,
  lineColor = '#007AFF',
  lineWidth = 3,
  colors = {},
  symbols = {},
  showImages = true,
  renderItem,
  fontSizes = { title: 16, description: 14, time: 12 },
  spacing = { item: 12 },
  footerComponent = null,
  isFictional = false,
  zoomScale = 1.0,
}, ref) => {
  const scrollViewRef = useRef(null);
  const itemPositions = useRef({});

  useImperativeHandle(ref, () => ({
    scrollToItem: (itemId) => {
      const position = itemPositions.current[itemId];
      if (position !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: position - 50, animated: true });
      }
    },
  }));

  const handleItemLayout = (itemId, y) => {
    itemPositions.current[itemId] = y;
  };
  const renderTimelineItem = (item, index) => {
    const side = index % 2 === 0 ? 'left' : 'right';
    const itemType = item._originalData?.type || item.type || 'default';
    const symbol = symbols[itemType] || null;
    const itemColors = {
      ...colors,
      default: colors.default || lineColor,
    };

    if (renderItem) {
      return renderItem(item, index, side);
    }

    // Debug: Log imageUrl if it exists
    if (item.imageUrl && showImages) {
      console.log('AlternatingTimeline passing imageUrl:', item.imageUrl, 'for item:', item.title || item.id);
    }

    return (
      <TimelineItem
        key={item.id || index}
        item={{
          ...item,
          type: itemType,
          imageUrl: item.imageUrl || item._originalData?.data?.imageUrl || null, // Explicitly ensure imageUrl is passed
        }}
        side={side}
        onPress={() => onItemPress && onItemPress(item, index)}
        onEdit={onItemEdit ? () => onItemEdit(item) : undefined}
        colors={itemColors}
        symbol={symbol}
        showImage={showImages}
        fontSizes={fontSizes}
        zoomScale={zoomScale}
      />
    );
  };

  // Calculate time-based positioning for non-fictional timelines
  const calculateTimeBasedPositions = () => {
    if (isFictional || !data.length) return null;

    // Helper to extract actual date from item (handles transformed data structure)
    const getItemDate = (item) => {
      // For eras, check startTime in the original data
      if (item._originalData?.data?.startTime) {
        const date = new Date(item._originalData.data.startTime);
        if (!isNaN(date.getTime())) return date;
      }
      // For events/scenes, check time in the original data
      if (item._originalData?.data?.time) {
        const date = new Date(item._originalData.data.time);
        if (!isNaN(date.getTime())) return date;
      }
      // Fall back to item.time if it's a valid date string (not a formatted display string)
      if (item.time && item.time !== 'No time specified') {
        // Check if it's a date string (YYYY-MM-DD format or ISO format)
        const dateStr = item.time;
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}/) || dateStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) return date;
        }
      }
      return null;
    };

    // Get all valid dates from items
    const validDates = data
      .map(item => getItemDate(item))
      .filter(Boolean);

    if (validDates.length === 0) return null;

    const minDate = new Date(Math.min(...validDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...validDates.map(d => d.getTime())));
    const timeSpan = maxDate.getTime() - minDate.getTime();

    if (timeSpan === 0) return null;

    // Determine tick interval based on time span
    let tickIntervalMs;
    const years = (maxDate.getFullYear() - minDate.getFullYear()) || 1;
    if (years > 50) {
      tickIntervalMs = 365.25 * 24 * 60 * 60 * 1000 * 10; // 10 years
    } else if (years > 10) {
      tickIntervalMs = 365.25 * 24 * 60 * 60 * 1000; // 1 year
    } else if (years > 1) {
      tickIntervalMs = 365.25 * 24 * 60 * 60 * 1000 / 12; // 1 month
    } else {
      const days = timeSpan / (24 * 60 * 60 * 1000);
      if (days > 30) {
        tickIntervalMs = 24 * 60 * 60 * 1000 * 7; // 1 week
      } else {
        tickIntervalMs = 24 * 60 * 60 * 1000; // 1 day
      }
    }

    // Generate tick marks
    const ticks = [];
    let currentTick = new Date(Math.floor(minDate.getTime() / tickIntervalMs) * tickIntervalMs);
    while (currentTick <= maxDate) {
      ticks.push(new Date(currentTick));
      currentTick = new Date(currentTick.getTime() + tickIntervalMs);
    }

    // Calculate item positions based on time
    // First pass: get positions for items with dates
    let itemPositions = data.map(item => {
      const date = getItemDate(item);
      const originalData = item._originalData || item;
      const itemData = originalData.data || originalData;
      
      // Check if item has relative positioning
      if (itemData.positionRelativeTo && !date) {
        // Will be positioned relative to another item in second pass
        return { item, yPosition: null, tickIndex: null, isRelative: true, positionRelativeTo: itemData.positionRelativeTo, positionType: itemData.positionType };
      }
      
      if (!date) return { item, yPosition: null, tickIndex: null };

      // Find nearest tick
      let nearestTickIndex = 0;
      let minDistance = Math.abs(date.getTime() - ticks[0].getTime());
      ticks.forEach((tick, index) => {
        const distance = Math.abs(date.getTime() - tick.getTime());
        if (distance < minDistance) {
          minDistance = distance;
          nearestTickIndex = index;
        }
      });

      return { item, tickIndex: nearestTickIndex, originalDate: date, isRelative: false };
    });

    // Group items by tick index to handle overlaps
    const itemsByTick = {};
    itemPositions.forEach(pos => {
      if (pos.tickIndex !== null) {
        if (!itemsByTick[pos.tickIndex]) {
          itemsByTick[pos.tickIndex] = [];
        }
        itemsByTick[pos.tickIndex].push(pos);
      }
    });

    // Calculate Y positions with spacing to prevent overlaps
    const tickSpacing = 150; // Space between ticks in pixels
    const minItemSpacing = 120; // Minimum space between items at the same tick
    const itemHeight = 100; // Estimated item height

    // First pass: position items with dates
    itemPositions = itemPositions.map(pos => {
      if (pos.tickIndex === null && !pos.isRelative) return pos;
      if (pos.isRelative) return pos; // Handle in second pass

      const itemsAtTick = itemsByTick[pos.tickIndex];
      if (itemsAtTick.length === 1) {
        // Single item at this tick - position at tick
        pos.yPosition = pos.tickIndex * tickSpacing + 16;
      } else {
        // Multiple items at same tick - stack them vertically
        const itemIndex = itemsAtTick.findIndex(p => p.item.id === pos.item.id);
        pos.yPosition = pos.tickIndex * tickSpacing + 16 + (itemIndex * minItemSpacing);
      }

      return pos;
    });

    // Second pass: position relatively positioned items
    // Sort items by order to ensure consistent positioning when dates aren't available
    const itemsWithOrder = itemPositions.map((pos, index) => {
      const originalData = pos.item._originalData || pos.item;
      const itemData = originalData.data || originalData;
      return {
        ...pos,
        order: itemData.order !== undefined ? itemData.order : index,
      };
    });
    itemsWithOrder.sort((a, b) => a.order - b.order);

    itemPositions = itemPositions.map(pos => {
      if (!pos.isRelative || !pos.positionRelativeTo) return pos;

      // Find the reference item
      const referencePos = itemPositions.find(p => {
        const refOriginalData = p.item._originalData || p.item;
        const refData = refOriginalData.data || refOriginalData;
        return refData.id === pos.positionRelativeTo;
      });

      if (!referencePos) {
        // Reference not found - use order-based positioning as fallback
        const originalData = pos.item._originalData || pos.item;
        const itemData = originalData.data || originalData;
        const refOriginalData = itemsWithOrder.find(p => {
          const pData = (p.item._originalData || p.item).data || (p.item._originalData || p.item);
          return pData.id === pos.positionRelativeTo;
        });
        
        if (refOriginalData) {
          const refOrder = (refOriginalData.item._originalData || refOriginalData.item).data?.order ?? 0;
          const itemOrder = itemData.order ?? 0;
          // Use order difference to calculate spacing (each order unit = 3 ticks)
          const orderDiff = Math.abs(itemOrder - refOrder) || 1;
          const defaultSpacing = 3 * tickSpacing * orderDiff;
          
          if (pos.positionType === 'before') {
            pos.yPosition = (refOrder * 3 * tickSpacing) - defaultSpacing;
          } else {
            pos.yPosition = (refOrder * 3 * tickSpacing) + defaultSpacing;
          }
        }
        return pos;
      }

      if (referencePos.yPosition === null) {
        // Reference has no date - use order-based spacing
        const originalData = pos.item._originalData || pos.item;
        const itemData = originalData.data || originalData;
        const refOriginalData = referencePos.item._originalData || referencePos.item;
        const refData = refOriginalData.data || refOriginalData;
        
        const refOrder = refData.order ?? 0;
        const itemOrder = itemData.order ?? 0;
        const orderDiff = Math.abs(itemOrder - refOrder) || 1;
        const defaultSpacing = 3 * tickSpacing * orderDiff;
        
        // Calculate base position from order
        const baseY = refOrder * 3 * tickSpacing;
        
        if (pos.positionType === 'before') {
          pos.yPosition = baseY - defaultSpacing;
        } else {
          pos.yPosition = baseY + defaultSpacing;
        }
        return pos;
      }

      // Reference has a date - use date-based positioning
      // Default to 3 ticks apart (3 * tickSpacing = 450px)
      const defaultSpacing = 3 * tickSpacing;
      
      if (pos.positionType === 'before') {
        // Position before reference (above) - 3 ticks apart
        pos.yPosition = referencePos.yPosition - defaultSpacing;
      } else {
        // Position after reference (below) - 3 ticks apart - default to 'after'
        pos.yPosition = referencePos.yPosition + defaultSpacing;
      }

      // Ensure no overlap with other items
      // Check all items and adjust if needed (use defaultSpacing as minimum)
      const conflictingPos = itemPositions.find(p => 
        p !== pos && 
        p.yPosition !== null && 
        Math.abs(p.yPosition - pos.yPosition) < defaultSpacing
      );

      if (conflictingPos) {
        // Adjust position to avoid overlap - maintain 3 tick spacing
        if (pos.positionType === 'before') {
          pos.yPosition = conflictingPos.yPosition - defaultSpacing;
        } else {
          pos.yPosition = conflictingPos.yPosition + defaultSpacing;
        }
      }

      return pos;
    });

    return {
      ticks,
      itemPositions,
      tickSpacing: 150 * zoomScale, // Scale tick spacing based on zoom (smaller = closer ticks)
      minDate,
      maxDate,
    };
  };

  const timeBasedData = calculateTimeBasedPositions();
  
  // Get screen width for SVG positioning
  const screenWidth = Dimensions.get('window').width;
  const centerX = screenWidth / 2;
  
  // Calculate tick marks - use time-based for non-fictional, evenly spaced for fictional
  let tickMarks = [];
  let contentHeight = 1000;
  if (timeBasedData) {
    // Track which ticks have nodes
    const ticksWithNodes = new Set();
    timeBasedData.itemPositions.forEach(pos => {
      if (pos.tickIndex !== null && pos.tickIndex !== undefined) {
        ticksWithNodes.add(pos.tickIndex);
      }
    });

    // Use time-based ticks - scale positions by zoom scale
    tickMarks = timeBasedData.ticks.map((tick, index) => ({
      y: (index * timeBasedData.tickSpacing + 16) * zoomScale,
      date: tick,
      hasNode: ticksWithNodes.has(index),
    }));
    
    // Calculate content height based on the maximum Y position of any item - scale by zoom
    const maxYPosition = Math.max(
      ...timeBasedData.itemPositions
        .filter(pos => pos.yPosition !== null)
        .map(pos => pos.yPosition * zoomScale),
      tickMarks.length > 0 ? tickMarks[tickMarks.length - 1].y + 16 : 0
    );
    contentHeight = Math.max(maxYPosition + 200 * zoomScale, 1000); // Add scaled padding at bottom
  } else {
    // Evenly spaced ticks for fictional timelines
    const tickMarkSpacing = 100 * zoomScale; // Scale tick spacing based on zoom
    const estimatedHeight = Math.max(data.length * (100 + spacing.item) * zoomScale, 1000);
    const tickMarkCount = Math.floor(estimatedHeight / tickMarkSpacing);
    tickMarks = Array.from({ length: tickMarkCount }).map((_, i) => ({
      y: i * tickMarkSpacing + 16,
      date: null,
      hasNode: false,
    }));
    contentHeight = estimatedHeight;
  }

  // Format date for tick label
  const formatTickLabel = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const years = d.getFullYear();
    const months = d.getMonth() + 1;
    const days = d.getDate();
    
    // Determine format based on tick interval
    if (timeBasedData) {
      const yearsSpan = (timeBasedData.maxDate.getFullYear() - timeBasedData.minDate.getFullYear()) || 1;
      if (yearsSpan > 50) {
        return years.toString(); // Just year for long spans
      } else if (yearsSpan > 10) {
        return `${months}/${years}`; // Month/Year
      } else if (yearsSpan > 1) {
        return `${months}/${days}/${years}`; // Month/Day/Year
      } else {
        return `${months}/${days}`; // Month/Day for same year
      }
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { minHeight: contentHeight }]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* SVG Container for Timeline Line, Ticks, and Labels */}
        <Svg
          style={styles.svgContainer}
          width={screenWidth}
          height={contentHeight}
        >
          {/* Central Timeline Line - Start at top of scroll content to go through all nodes */}
          <Line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={contentHeight}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />

          {/* Tick Marks - Match timeline color */}
          {tickMarks.map((tick, i) => (
            <React.Fragment key={`tick-${i}`}>
              <Rect
                x={centerX - 6}
                y={tick.y}
                width={12}
                height={2}
                fill={lineColor} // Same color as timeline line
              />
              {/* Label for ticks without nodes */}
              {!tick.hasNode && tick.date && (
                <SvgText
                  x={centerX + 8}
                  y={tick.y + 4}
                  fontSize={10}
                  fill="#9CA3AF"
                  fontFamily="System"
                >
                  {formatTickLabel(tick.date)}
                </SvgText>
              )}
            </React.Fragment>
          ))}
        </Svg>

        {/* Timeline Items */}
        <View style={styles.itemsContainer}>
          {data.map((item, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const itemType = item._originalData?.type || item.type || 'default';
            const itemColor = colors[itemType] || colors.default || lineColor;
            
            // Get time-based position if available
            const timePosition = timeBasedData?.itemPositions.find(p => p.item.id === item.id);
            // TimelineItem uses absolute positioning relative to viewport
            // Scale the Y position based on zoom scale
            const itemStyle = timePosition && timePosition.yPosition !== null
              ? { top: timePosition.yPosition * zoomScale, height: 0 } // Scale Y position and height: 0 to collapse container
              : { marginBottom: spacing.item * zoomScale };
            
            return (
              <View 
                key={item.id || index} 
                onLayout={(event) => {
                  if (item.id) {
                    const { y } = event.nativeEvent.layout;
                    handleItemLayout(item.id, y);
                  }
                }}
                style={[styles.itemRow, itemStyle]}
              >
                {renderTimelineItem(item, index)}
              </View>
            );
          })}
        </View>
        
        {/* Footer Component */}
        {footerComponent && (
          <View style={styles.footer}>
            {footerComponent}
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A2E',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    position: 'relative',
    minHeight: '100%',
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0, // Back at bottom, below nodes
  },
  itemsContainer: {
    position: 'relative',
    zIndex: 1,
  },
  itemRow: {
    paddingHorizontal: 0,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default AlternatingTimeline;

