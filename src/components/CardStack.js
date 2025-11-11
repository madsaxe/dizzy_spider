import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import CardItem from './CardItem';

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
}) => {
  // Calculate child count for an item
  const getChildCount = (item, itemType, itemData) => {
    if (itemType === 'era' && zoomLevel === 'eras') {
      // Era has Events as children
      const eraEvents = events[itemData.id] || [];
      return eraEvents.length;
    } else if (itemType === 'event' && zoomLevel === 'events') {
      // Event has Scenes as children
      const eventScenes = scenes[itemData.id] || [];
      return eventScenes.length;
    }
    // Scenes have no children, or we're already at a deeper zoom level
    return 0;
  };
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyCardContent}>
            {/* Empty card visual - shows what a card looks like */}
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
      {data.map((item, index) => {
        const originalData = item._originalData || item;
        const itemData = originalData.data || originalData;
        const itemType = originalData.type || item.type;
        const childCount = getChildCount(item, itemType, itemData);

        return (
          <CardItem
            key={item.id || index}
            item={{
              ...item,
              type: itemType,
              title: item.title || itemData?.title,
              description: item.description || itemData?.description,
              time: item.time,
              imageUrl: item.imageUrl || itemData?.imageUrl,
            }}
            onPress={() => onItemPress && onItemPress(item, index)}
            onEdit={onItemEdit ? () => onItemEdit(item) : undefined}
            colors={colors}
            showImage={showImages}
            fontSizes={fontSizes}
            childCount={childCount}
            zoomLevel={zoomLevel}
          />
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignItems: 'center', // Center cards horizontally
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

export default CardStack;

