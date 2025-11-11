import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import TimelineItem from './TimelineItem';

const AlternatingTimeline = ({
  data = [],
  onItemPress,
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
}) => {
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

    return (
      <TimelineItem
        key={item.id || index}
        item={{
          ...item,
          type: itemType,
        }}
        side={side}
        onPress={() => onItemPress && onItemPress(item, index)}
        colors={itemColors}
        symbol={symbol}
        showImage={showImages}
        fontSizes={fontSizes}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* Central Timeline Line */}
        <View style={[styles.timelineLine, { backgroundColor: lineColor, width: lineWidth }]} />

        {/* Timeline Items */}
        <View style={styles.itemsContainer}>
          {data.map((item, index) => (
            <View key={item.id || index} style={[styles.itemRow, { marginBottom: spacing.item }]}>
              {renderTimelineItem(item, index)}
            </View>
          ))}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    marginLeft: -1.5, // Half of line width
    zIndex: 0,
  },
  itemsContainer: {
    position: 'relative',
    zIndex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 120,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default AlternatingTimeline;

