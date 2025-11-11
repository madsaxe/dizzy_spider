import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Icon } from 'react-native-paper';

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
  const [nodeHeight, setNodeHeight] = useState(100); // Default to minHeight
  
  // Calculate triangle border widths to match node height
  // For border-based triangles: triangle height = borderTopWidth + borderBottomWidth
  // We want 1.5px border width, so:
  const borderWidth = 1.5;
  // Triangle depth should reach the central timeline
  // Nodes are 45% width, so gap to center is approximately 5% of screen width
  // Calculate dynamically based on screen width to ensure triangle reaches center
  const screenWidth = Dimensions.get('window').width;
  const nodeWidth = screenWidth * 0.45; // 45% of screen
  const gapToCenter = (screenWidth / 2) - nodeWidth; // Distance from node edge to center
  const triangleDepth = Math.max(60, gapToCenter + 10); // Ensure triangle reaches center with small buffer
  // Triangle height should match node height
  // Outer triangle (with border): slightly larger
  const outerTriangleTop = (nodeHeight / 2) + borderWidth;
  const outerTriangleBottom = (nodeHeight / 2) + borderWidth;
  const outerTriangleDepth = triangleDepth + borderWidth;
  // Inner triangle (fill): matches node height
  const innerTriangleTop = nodeHeight / 2;
  const innerTriangleBottom = nodeHeight / 2;
  const innerTriangleDepth = triangleDepth;
  
  // Use imageUrl directly - React Native handles URL encoding automatically
  // Only log errors, not successful loads to reduce console noise

  return (
    <View style={[
      styles.container,
      isLeft ? styles.leftContainer : styles.rightContainer,
    ]}>
      {/* Triangle Shape - Separate from node */}
      {!isLeft && (
        <View style={[
          styles.triangleRight, 
          { 
            borderRightColor: itemColor, 
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderTopWidth: innerTriangleTop,
            borderBottomWidth: innerTriangleBottom,
            borderRightWidth: innerTriangleDepth,
          }
        ]} />
      )}
      
      {/* Node Rectangle */}
      <TouchableOpacity
        style={styles.nodeWrapper}
        onPress={onPress}
        activeOpacity={0.7}
      >
      {showImage && imageUrl ? (
        <ImageBackground
          source={{ uri: imageUrl.trim() }}
          style={[
            styles.content,
            styles.contentWithImage,
            { borderColor: itemColor },
            isLeft ? styles.leftContent : styles.rightContent,
          ]}
          resizeMode="cover"
          imageStyle={[styles.backgroundImageStyle, { width: '100%', height: '100%' }]}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            if (height > 0) {
              setNodeHeight(height);
            }
          }}
          onError={(error) => {
            // Silently fail - image URLs may not exist, that's okay
            // Only log in development if needed
            if (__DEV__) {
              const errorInfo = error.nativeEvent || error;
              if (errorInfo?.responseCode === 404) {
                // 404 means image doesn't exist - this is expected for some seed data URLs
                // Don't log to reduce console noise
              }
            }
          }}
          onLoad={() => {
            // Image loaded successfully - no need to log
          }}
          onLoadStart={() => {
            // Image loading started - no need to log
          }}
        >
          {/* Color Overlay */}
          <View style={[styles.colorOverlay, { backgroundColor: itemColor }]} />
          
          {/* Content on top of overlay */}
          <View style={styles.contentOverlay}>
            {/* Symbol/Icon */}
            {symbol && (
              <View style={[styles.symbolContainer, { backgroundColor: itemColor }]}>
                {type === 'era' ? (
                  <Icon
                    source="chart-timeline"
                    size={16}
                    color="#1A1A2E"
                  />
                ) : type === 'event' ? (
                  <Icon
                    source="timeline-outline"
                    size={16}
                    color="#1A1A2E"
                  />
                ) : type === 'scene' ? (
                  <Icon
                    source="star-box-outline"
                    size={16}
                    color="#1A1A2E"
                  />
                ) : (
                  <Text style={styles.symbol}>{symbol}</Text>
                )}
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
        </ImageBackground>
      ) : (
        <View
          style={[
            styles.content,
            { borderColor: itemColor },
            isLeft ? styles.leftContent : styles.rightContent,
          ]}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            if (height > 0) {
              setNodeHeight(height);
            }
          }}
        >
          {/* Symbol/Icon */}
          {symbol && (
            <View style={[styles.symbolContainer, { backgroundColor: itemColor }]}>
              {type === 'era' ? (
                <Icon
                  source="chart-timeline"
                  size={16}
                  color="#1A1A2E"
                />
              ) : type === 'event' ? (
                <Icon
                  source="timeline-outline"
                  size={16}
                  color="#1A1A2E"
                />
              ) : type === 'scene' ? (
                <Icon
                  source="star-box-outline"
                  size={16}
                  color="#1A1A2E"
                />
              ) : (
                <Text style={styles.symbol}>{symbol}</Text>
              )}
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
      )}
      </TouchableOpacity>
      
      {/* Triangle Shape - For left nodes, triangle on right edge */}
      {isLeft && (
        <View style={[
          styles.triangleLeft, 
          { 
            borderLeftColor: itemColor, 
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderTopWidth: innerTriangleTop,
            borderBottomWidth: innerTriangleBottom,
            borderLeftWidth: innerTriangleDepth,
          }
        ]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '45%',
    marginVertical: 12,
    flexDirection: 'row', // Arrange node and triangle side by side
    alignItems: 'center',
  },
  leftContainer: {
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  rightContainer: {
    justifyContent: 'flex-start',
    paddingLeft: 8,
  },
  nodeWrapper: {
    flex: 1, // Node takes available space
  },
  content: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'visible', // Changed to 'visible' to allow triangle to extend
    borderColor: '#2A2A3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
    position: 'relative',
  },
  leftContent: {
    borderRightWidth: 0, // Remove right border, triangle will replace it
    borderTopRightRadius: 0, // Remove rounded corner on right
    borderBottomRightRadius: 0,
  },
  rightContent: {
    borderLeftWidth: 0, // Remove left border, triangle will replace it
    borderTopLeftRadius: 0, // Remove rounded corner on left
    borderBottomLeftRadius: 0,
  },
  triangleLeft: {
    // Triangle that points LEFT (used for left nodes on right edge)
    // Positioned next to node, not absolutely
    position: 'relative', // For inner triangle positioning
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    // borderTopWidth, borderBottomWidth, and borderLeftWidth set dynamically
    borderTopColor: 'transparent', // Will be overridden
    borderBottomColor: 'transparent', // Will be overridden
    borderLeftColor: 'transparent', // Will be overridden
    // No border on right side (touching the node)
    borderRightWidth: 0,
    alignSelf: 'stretch', // Match node height
  },
  triangleLeftInner: {
    position: 'absolute',
    left: -1.5, // Offset for border
    top: 1.5, // Offset for border
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    // borderTopWidth, borderBottomWidth, and borderLeftWidth set dynamically
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'red', // Red fill
    borderRightWidth: 0,
    zIndex: 4,
  },
  triangleRight: {
    // Triangle that points RIGHT (used for right nodes on left edge)
    // Positioned next to node, not absolutely
    position: 'relative', // For inner triangle positioning
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    // borderTopWidth, borderBottomWidth, and borderRightWidth set dynamically
    borderTopColor: 'transparent', // Will be overridden
    borderBottomColor: 'transparent', // Will be overridden
    borderRightColor: 'transparent', // Will be overridden
    // No border on left side (touching the node)
    borderLeftWidth: 0,
    alignSelf: 'stretch', // Match node height
  },
  triangleRightInner: {
    position: 'absolute',
    right: -1.5, // Offset for border
    top: 1.5, // Offset for border
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    // borderTopWidth, borderBottomWidth, and borderRightWidth set dynamically
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'red', // Red fill
    borderLeftWidth: 0,
    zIndex: 4,
  },
  contentWithImage: {
    width: '100%',
    minHeight: 100,
    backgroundColor: '#1A1A2E', // Fallback background in case image doesn't load
  },
  backgroundImageStyle: {
    opacity: 0.7, // Increased to make image more visible
  },
  colorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2, // Further reduced to make image more visible
    zIndex: 1,
  },
  contentOverlay: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
    minHeight: 100,
  },
  symbolContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  symbol: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    padding: 14,
  },
  time: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 11,
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  description: {
    color: '#9CA3AF',
    lineHeight: 17,
    fontSize: 12,
  },
});

export default TimelineItem;
