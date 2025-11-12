import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Icon } from 'react-native-paper';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  ClipPath,
  Mask,
  Polygon,
  Pattern,
  Image as SvgImage,
  Rect,
  G,
} from 'react-native-svg';
import { getLocalImage, hasLocalImage } from '../assets/images';
import {
  generateFlatTopHexagonPath,
  generateClipPath,
  calculateHexagonDimensions,
} from '../utils/hexagonUtils';

const screenWidth = Dimensions.get('window').width;

// Calculate hexagon dimensions - square hexagon (height = width)
// Use a larger size for better visibility
const HEXAGON_SIZE = Math.min(screenWidth * 0.75, 450); // Increased size, max 450px

// Hexagon dimensions (square - height equals width)
const HEXAGON_WIDTH = HEXAGON_SIZE;
const HEXAGON_HEIGHT = HEXAGON_SIZE;
const BORDER_WIDTH = 1.5;
const BORDER_OFFSET = BORDER_WIDTH / 2;

const HexagonNode = ({
  item,
  onPress,
  onEdit,
  colors = {},
  showImage = true,
  fontSizes = { title: 16, description: 14, time: 12 },
  zoomLevel = 'eras',
  style = {},
  animatedStyle = null,
  shouldDarken = false, // Whether to apply darkening overlay
}) => {
  const {
    title,
    description,
    time,
    imageUrl,
    type,
  } = item;

  const itemColor = colors[type] || colors.default || '#007AFF';
  
  // Get icon for node type
  const getNodeIcon = () => {
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

  const nodeIcon = getNodeIcon();

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

  // Generate unique IDs for SVG elements
  const hexagonId = `hexagon-${item.id || 'default'}`;
  const clipPathId = `clip-${item.id || 'default'}`;
  const maskId = `mask-${item.id || 'default'}`;
  const gradientId = `gradient-${item.id || 'default'}`;
  const patternId = `pattern-${item.id || 'default'}`;

  // Generate hexagon paths
  // Border path: includes border offset to center the stroke
  const hexagonPath = generateFlatTopHexagonPath(HEXAGON_SIZE + BORDER_WIDTH, BORDER_OFFSET);
  // Clip path: exact hexagon shape, centered in SVG (accounts for border)
  // The SVG is HEXAGON_SIZE + BORDER_WIDTH, so we center the hexagon
  const clipPathData = generateFlatTopHexagonPath(HEXAGON_SIZE, BORDER_OFFSET);

  // Node content
  const nodeContent = (
    <View style={styles.contentContainer} pointerEvents="box-none">
      {/* Node icon - positioned in upper left corner */}
      {nodeIcon && (
        <View style={[styles.iconContainer, { backgroundColor: itemColor, opacity: shouldDarken ? 0.5 : 1 }]}>
          <Icon
            source={nodeIcon}
            size={20}
            color="#1A1A2E"
          />
        </View>
      )}

      {/* Spacer to push content to bottom half */}
      <View style={styles.spacer} />

      {/* Title and Description - In bottom half of hexagon */}
      <View style={styles.textContent}>
        {/* Title - centered and lowered, all caps */}
        <Text style={[styles.title, { fontSize: fontSizes.title, opacity: shouldDarken ? 0.5 : 1 }]} numberOfLines={2}>
          {title.toUpperCase()}
        </Text>

        {/* Description - directly under title */}
        {description && (
          <Text style={[styles.description, { fontSize: fontSizes.description, opacity: shouldDarken ? 0.5 : 1 }]} numberOfLines={3}>
            {description}
          </Text>
        )}
      </View>

      {/* Time/Date - Bottom center with padding */}
      {time && (
        <Text style={[styles.timeText, { color: itemColor, fontSize: fontSizes.time, opacity: shouldDarken ? 0.5 : 1 }]}>
          {time}
        </Text>
      )}

      {/* Edit Button - Top Right */}
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

  // Render the hexagon with content
  const hexagonElement = (
    <View style={[styles.hexagonWrapper, style]} pointerEvents="box-none">
      <Svg
        width={HEXAGON_SIZE + BORDER_WIDTH}
        height={HEXAGON_SIZE + BORDER_WIDTH}
        style={styles.hexagonSvg}
      >
        <Defs>
          {/* Clip path for hexagon shape - clips to exact hexagon boundaries */}
          <ClipPath id={clipPathId}>
            <Path d={clipPathData} />
          </ClipPath>

          {/* Gradient overlay (transparent top to opaque bottom, darker sooner) */}
          {/* When shouldDarken is true, increase opacity by 50% (then another 50% = 0.45 * 1.5 = 0.675) */}
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#1A1A2E" stopOpacity={shouldDarken ? "0.2" : "0"} />
            <Stop offset="40%" stopColor="#1A1A2E" stopOpacity={shouldDarken ? "0.8" : "0.3"} />
            <Stop offset="70%" stopColor="#1A1A2E" stopOpacity={shouldDarken ? "1" : "0.8"} />
            <Stop offset="100%" stopColor="#1A1A2E" stopOpacity={shouldDarken ? "1" : "1"} />
          </SvgLinearGradient>

          {/* Pattern for remote images */}
          {imageSource && imageSource.uri && (
            <Pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={HEXAGON_SIZE + BORDER_WIDTH}
              height={HEXAGON_SIZE + BORDER_WIDTH}
              x="0"
              y="0"
            >
              <SvgImage
                href={imageSource.uri}
                width={HEXAGON_SIZE + BORDER_WIDTH}
                height={HEXAGON_SIZE + BORDER_WIDTH}
                preserveAspectRatio="xMidYMid slice"
              />
            </Pattern>
          )}
        </Defs>

        {/* Background - image or solid color */}
        {imageSource && imageSource.uri ? (
          // Remote image via pattern with clip path for proper hexagon clipping
          <>
            <G clipPath={`url(#${clipPathId})`}>
              <Rect
                x="0"
                y="0"
                width={HEXAGON_SIZE + BORDER_WIDTH}
                height={HEXAGON_SIZE + BORDER_WIDTH}
                fill={`url(#${patternId})`}
              />
            </G>
            {/* Gradient overlay for remote images */}
            <G clipPath={`url(#${clipPathId})`}>
              <Rect
                x="0"
                y="0"
                width={HEXAGON_SIZE + BORDER_WIDTH}
                height={HEXAGON_SIZE + BORDER_WIDTH}
                fill={`url(#${gradientId})`}
              />
            </G>
          </>
        ) : (
          // Solid color background
          <>
            <Path
              d={clipPathData}
              fill="#16213E"
            />
            {/* Gradient overlay for solid color when shouldDarken is true */}
            {shouldDarken && (
              <G clipPath={`url(#${clipPathId})`}>
                <Rect
                  x="0"
                  y="0"
                  width={HEXAGON_SIZE + BORDER_WIDTH}
                  height={HEXAGON_SIZE + BORDER_WIDTH}
                  fill={`url(#${gradientId})`}
                />
              </G>
            )}
          </>
        )}

        {/* Border - drawn on top */}
        <Path
          d={hexagonPath}
          fill="transparent"
          stroke={itemColor}
          strokeWidth={BORDER_WIDTH}
        />
      </Svg>

      {/* Local image overlay (if using local image) - Use SVG with clipPath for proper hexagon clipping */}
      {imageSource && !imageSource.uri && (
        <Svg
          width={HEXAGON_SIZE + BORDER_WIDTH}
          height={HEXAGON_SIZE + BORDER_WIDTH}
          style={styles.localImageSvg}
        >
          <Defs>
            {/* Clip path for local image (same as main SVG) */}
            <ClipPath id={`${clipPathId}-local`}>
              <Path d={clipPathData} />
            </ClipPath>
            {/* Pattern for local image - convert local asset to URI */}
            <Pattern
              id={`${patternId}-local`}
              patternUnits="userSpaceOnUse"
              width={HEXAGON_SIZE + BORDER_WIDTH}
              height={HEXAGON_SIZE + BORDER_WIDTH}
              x="0"
              y="0"
            >
              <SvgImage
                href={Image.resolveAssetSource(imageSource).uri}
                width={HEXAGON_SIZE + BORDER_WIDTH}
                height={HEXAGON_SIZE + BORDER_WIDTH}
                preserveAspectRatio="xMidYMid slice"
              />
            </Pattern>
            {/* Gradient overlay for local images (darker sooner) */}
            {/* When shouldDarken is true, increase opacity by 50% (then another 50% = 0.45 * 1.5 = 0.675) */}
            <SvgLinearGradient id={`${gradientId}-local-overlay`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#1A1A2E" stopOpacity={shouldDarken ? "0.2" : "0"} />
              <Stop offset="40%" stopColor="#1A1A2E" stopOpacity={shouldDarken ? "0.8" : "0.3"} />
              <Stop offset="70%" stopColor="#1A1A2E" stopOpacity={shouldDarken ? "1" : "0.8"} />
              <Stop offset="100%" stopColor="#1A1A2E" stopOpacity={shouldDarken ? "1" : "1"} />
            </SvgLinearGradient>
          </Defs>
          {/* Local image with clipPath for proper hexagon clipping */}
          <G clipPath={`url(#${clipPathId}-local)`}>
            <Rect
              x="0"
              y="0"
              width={HEXAGON_SIZE + BORDER_WIDTH}
              height={HEXAGON_SIZE + BORDER_WIDTH}
              fill={`url(#${patternId}-local)`}
            />
          </G>
          {/* Gradient overlay with clipPath */}
          <G clipPath={`url(#${clipPathId}-local)`}>
            <Rect
              x="0"
              y="0"
              width={HEXAGON_SIZE + BORDER_WIDTH}
              height={HEXAGON_SIZE + BORDER_WIDTH}
              fill={`url(#${gradientId}-local-overlay)`}
            />
          </G>
        </Svg>
      )}

      {/* Content overlay */}
      <View style={styles.contentOverlay} pointerEvents="box-none">
        {nodeContent}
      </View>
    </View>
  );

  // Wrap in TouchableOpacity if onPress is provided
  if (onPress) {
    const TouchableWrapper = animatedStyle ? TouchableOpacity : TouchableOpacity;
    return (
      <TouchableWrapper
        onPress={onPress}
        activeOpacity={0.8}
        style={animatedStyle || {}}
      >
        {hexagonElement}
      </TouchableWrapper>
    );
  }

  return hexagonElement;
};

const styles = StyleSheet.create({
  hexagonWrapper: {
    width: HEXAGON_SIZE + BORDER_WIDTH,
    height: HEXAGON_SIZE + BORDER_WIDTH,
    position: 'relative',
  },
  hexagonSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  localImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: HEXAGON_SIZE,
    height: HEXAGON_SIZE,
    overflow: 'hidden',
    zIndex: 1,
  },
  localImageSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  localImage: {
    width: HEXAGON_SIZE,
    height: HEXAGON_SIZE,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  localImageGradientSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 3,
  },
  contentOverlay: {
    position: 'absolute',
    top: BORDER_OFFSET,
    left: BORDER_OFFSET,
    width: HEXAGON_SIZE,
    height: HEXAGON_SIZE,
    zIndex: 10,
    padding: 20,
    overflow: 'hidden', // Ensure content stays within hexagon bounds
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'stretch',
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    top: 20, // Near top of hexagon
    // Position left of center by 3/5 of top edge length
    // For a flat-top hexagon with radius r, top edge length = r (horizontal distance between top vertices)
    // radius ≈ HEXAGON_SIZE / 1.8 (based on hexagon calculation: Math.min(w/1.8, h/2.0))
    // Top edge length ≈ HEXAGON_SIZE / 1.8
    // 3/5 of top edge = (HEXAGON_SIZE / 1.8) * (3/5) = HEXAGON_SIZE * 3 / (1.8 * 5) = HEXAGON_SIZE / 3
    // Center of content area is at HEXAGON_SIZE / 2
    // Icon center should be at: center - (3/5 * topEdge) = HEXAGON_SIZE/2 - HEXAGON_SIZE/3
    // But we need left position, so subtract half icon width (16px)
    left: (HEXAGON_SIZE / 2) - (HEXAGON_SIZE / 3) - 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  spacer: {
    flex: 0.5, // Takes up top half (50%), so content starts at centerpoint
    minHeight: 0,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 16, // Space between text content and date
    flexShrink: 0,
    marginTop: 32, // Move down a couple of line heights (approx 2 * 16px line height)
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center', // Center the title
    marginBottom: 6, // Reduced spacing between title and description
    letterSpacing: -0.3,
    width: '100%',
  },
  description: {
    fontSize: 14,
    color: '#B0B8C4', // Lighter color for description
    lineHeight: 20,
    textAlign: 'center', // Center the description
    width: '100%',
  },
  timeText: {
    position: 'absolute',
    bottom: 20, // Align to bottom with padding
    left: 0,
    right: 0,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center', // Center the time/date
    width: '100%',
    flexShrink: 0,
  },
  editButton: {
    position: 'absolute',
    top: 12,
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

export default HexagonNode;
export { HEXAGON_WIDTH, HEXAGON_HEIGHT, HEXAGON_SIZE };

