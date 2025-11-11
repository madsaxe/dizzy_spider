import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Icon } from 'react-native-paper';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { getLocalImage, hasLocalImage } from '../assets/images';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Playing card aspect ratio: 2.5:3.5 (width:height) = 0.714:1
// Standard playing card dimensions: 2.5" x 3.5"
// Aspect ratio: height/width = 3.5/2.5 = 1.4
// So: height = width * 1.4, or width = height / 1.4

// Calculate card width (use 70% of screen width, with margins)
const cardWidthValue = Math.min(screenWidth * 0.7, 400); // Max 400px for larger screens
const cardHeightValue = cardWidthValue * 1.4 * 0.7; // Playing card aspect ratio, reduced by 30%

// Card dimensions
const CARD_WIDTH = cardWidthValue;
const CARD_HEIGHT = cardHeightValue;

const CardItem = ({
  item,
  onPress,
  onEdit,
  colors = {},
  showImage = true,
  fontSizes = { title: 16, description: 14, time: 12 },
  childCount = 0,
  zoomLevel = 'eras',
}) => {
  const {
    title,
    description,
    time,
    imageUrl,
    type,
  } = item;

  const itemColor = colors[type] || colors.default || '#007AFF';
  const isScene = type === 'scene';
  
  // Limit the number of visible stacked cards (max 3 for visual clarity)
  const visibleStackCount = Math.min(childCount, 3);
  
  // Get the child level color based on current zoom level and item type
  const getChildLevelColor = () => {
    if (type === 'era' && zoomLevel === 'eras') {
      // Era has Events as children
      return colors.event || colors.default;
    } else if (type === 'event' && zoomLevel === 'events') {
      // Event has Scenes as children
      return colors.scene || colors.default;
    }
    // No children or unknown type
    return colors.default;
  };
  
  const childLevelColor = getChildLevelColor();

  // Determine image source - handle both local assets and remote URLs
  const getImageSource = () => {
    if (!imageUrl || !showImage) return null;
    
    // Check if it's a local image key
    if (hasLocalImage(imageUrl)) {
      const localImage = getLocalImage(imageUrl);
      return localImage;
    }
    
    // Otherwise treat as remote URL
    return { uri: imageUrl.trim() };
  };

  const imageSource = getImageSource();

  // Get icon for card type
  const getCardIcon = () => {
    switch (type) {
      case 'era':
        return 'chart-timeline';
      case 'event':
        return 'timeline-outline';
      case 'scene':
        return 'star-box-outline';
      default:
        return null;
    }
  };

  const cardIcon = getCardIcon();

  // Render stacked cards behind the main card
  const renderStackedCards = () => {
    if (visibleStackCount === 0) return null;
    
    return (
      <>
        {Array.from({ length: visibleStackCount }).map((_, index) => {
          const stackIndex = visibleStackCount - index - 1; // Reverse order for visual stacking (furthest first)
          const offset = (stackIndex + 1) * 12; // 12px offset per card for better visibility
          const opacity = 0.5 - (stackIndex * 0.1); // Decreasing opacity for depth
          
          return (
            <View
              key={`stack-${index}`}
              style={[
                styles.stackedCard,
                {
                  top: offset,
                  left: offset,
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  borderColor: childLevelColor, // Use child level color (event color for eras, scene color for events)
                  borderWidth: 1.5, // Match Advanced timeline border width
                  opacity: Math.max(opacity, 0.3),
                  zIndex: index + 1, // Lower z-index than main card
                },
              ]}
              pointerEvents="none"
            />
          );
        })}
      </>
    );
  };

  const cardContent = (
    <View style={styles.cardContent}>
      {/* Header with icon and time */}
      <View style={styles.cardHeader}>
        {cardIcon && (
          <View style={[styles.iconContainer, { backgroundColor: itemColor }]}>
            <Icon
              source={cardIcon}
              size={20}
              color="#1A1A2E"
            />
          </View>
        )}
        {time && (
          <Text style={[styles.timeText, { color: itemColor, fontSize: fontSizes.time }]}>
            {time}
          </Text>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { fontSize: fontSizes.title }]} numberOfLines={2}>
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text style={[styles.description, { fontSize: fontSizes.description }]} numberOfLines={3}>
          {description}
        </Text>
      )}

      {/* Edit Button - Bottom Right */}
      {onEdit && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Gradient overlay component for image cards
  const gradientId = `gradientOverlay-${item.id || 'default'}`;
  const GradientOverlay = () => {
    if (!imageSource) return null;
    
    return (
      <Svg
        style={styles.gradientOverlay}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#1A1A2E" stopOpacity="0" />
            <Stop offset="100%" stopColor="#1A1A2E" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          fill={`url(#${gradientId})`}
        />
      </Svg>
    );
  };

  const cardElement = imageSource ? (
    <TouchableOpacity
      style={[styles.cardContainer, { borderColor: itemColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={imageSource}
        style={styles.cardImageBackground}
        imageStyle={styles.cardImageStyle}
      >
        {/* Gradient overlay - transparent at top, opaque at bottom */}
        <GradientOverlay />
        {cardContent}
      </ImageBackground>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={[styles.cardContainer, styles.cardWithoutImage, { borderColor: itemColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {cardContent}
    </TouchableOpacity>
  );

  // Calculate bottom padding for stacked cards (to ensure stacked cards are visible)
  const stackPadding = visibleStackCount > 0 ? (visibleStackCount * 12) : 0;

  return (
    <View style={[styles.cardWrapper, { 
      width: CARD_WIDTH,
      height: CARD_HEIGHT + stackPadding,
    }]}>
      {renderStackedCards()}
      {cardElement}
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'center', // Center the card horizontally
    position: 'relative',
  },
  stackedCard: {
    position: 'absolute',
    backgroundColor: '#16213E',
    borderRadius: 14, // Match Advanced timeline border radius
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    // Width and height set dynamically to CARD_WIDTH and CARD_HEIGHT
    // borderWidth and borderColor set dynamically (child level color)
  },
  cardContainer: {
    borderRadius: 14, // Match Advanced timeline border radius
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
    zIndex: 10,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderWidth: 1.5, // Match Advanced timeline border width
  },
  cardWithoutImage: {
    backgroundColor: '#16213E',
    // borderWidth and borderColor will be set dynamically based on itemColor
  },
  cardImageBackground: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardImageStyle: {
    borderRadius: 14, // Match Advanced timeline border radius
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1, // Above image, below content
    pointerEvents: 'none',
  },
  cardContent: {
    padding: 16,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2, // Above gradient overlay
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 8,
  },
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default CardItem;

