import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const TimelineItem = ({
  item,
  side = 'left', // 'left' or 'right'
  onPress,
  colors = {},
  symbol = null,
  showImage = true,
  fontSizes = { title: 16, description: 14, time: 12 },
}) => {
  const {
    title,
    description,
    time,
    imageUrl,
    type,
  } = item;

  const itemColor = colors[type] || colors.default || '#007AFF';
  const isLeft = side === 'left';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isLeft ? styles.leftContainer : styles.rightContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.content,
          { borderColor: itemColor },
          isLeft ? styles.leftContent : styles.rightContent,
        ]}
      >
        {/* Hero Image */}
        {showImage && imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        {/* Symbol/Icon */}
        {symbol && (
          <View style={[styles.symbolContainer, { backgroundColor: itemColor }]}>
            <Text style={styles.symbol}>{symbol}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.textContainer}>
          {time && (
            <Text style={[styles.time, { color: itemColor, fontSize: fontSizes.time }]}>{time}</Text>
          )}
          <Text style={[styles.title, { fontSize: fontSizes.title }]}>{title}</Text>
          {description && (
            <Text style={[styles.description, { fontSize: fontSizes.description }]} numberOfLines={3}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '45%',
    marginVertical: 12,
  },
  leftContainer: {
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  rightContainer: {
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },
  leftContent: {
    borderRightWidth: 4,
  },
  rightContent: {
    borderLeftWidth: 4,
  },
  heroImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  symbolContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  symbol: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    padding: 12,
  },
  time: {
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  description: {
    color: '#666',
    lineHeight: 20,
  },
});

export default TimelineItem;
