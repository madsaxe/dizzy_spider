import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Icon } from 'react-native-paper';
import Svg, { Polygon, Rect, Path, Image as SvgImage, Defs, Pattern, ClipPath, Mask } from 'react-native-svg';
import { getLocalImage, hasLocalImage } from '../assets/images';

const TimelineItem = ({
  item,
  side = 'left', // 'left' or 'right'
  onPress,
  onEdit,
  colors = {},
  symbol = null,
  showImage = true,
  fontSizes = { title: 16, description: 14, time: 12 },
  zoomScale = 1.0,
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
  const screenHeight = Dimensions.get('window').height;
  const nodeHeightValue = screenHeight * 0.15 * zoomScale; // 15% of screen height, scaled by zoom
  const [nodeHeight, setNodeHeight] = useState(nodeHeightValue);
  
  // Calculate triangle border widths to match node height
  // For border-based triangles: triangle height = borderTopWidth + borderBottomWidth
  // We want 1.5px border width, matching the node border
  const borderWidth = 1.5;
  const screenWidth = Dimensions.get('window').width;
  const centerX = screenWidth / 2;
  
  // Calculate dimensions: total width (node + triangle) = 49% of screen
  const totalNodeWidth = screenWidth * 0.49;
  const triangleDepth = screenWidth * 0.04; // 4% of screen
  const nodeWidth = totalNodeWidth - triangleDepth; // Rectangle width = total - triangle
  
  // Position nodes so triangle tip touches center line
  // Path coordinates are offset by borderOffset (borderWidth/2) to center the border stroke
  // For left nodes: triangle tip in SVG is at x = borderOffset + totalNodeWidth
  //   Container left = centerX - (borderOffset + totalNodeWidth) = centerX - totalNodeWidth - borderOffset
  // For right nodes: triangle tip in SVG is at x = borderOffset
  //   Container left = centerX - borderOffset
  const borderOffset = borderWidth / 2;
  const leftNodeX = centerX - totalNodeWidth - borderOffset;
  const rightNodeX = centerX - borderOffset;
  
  // Triangle height should match node height
  // Using CSS-style border technique: width: 0, height: 0, with borders forming the triangle
  
  // Determine image source - handle both local assets and remote URLs
  const getImageSource = () => {
    if (!imageUrl) return null;
    
    // Check if it's a local image key
    if (hasLocalImage(imageUrl)) {
      const localImage = getLocalImage(imageUrl);
      if (__DEV__) {
        console.log(`[TimelineItem] Using local image: ${imageUrl}`, localImage);
        console.log(`[TimelineItem] Local image type:`, typeof localImage, localImage);
      }
      // For local images, require() returns a number (asset ID) or object
      // React Native ImageBackground expects the require() result directly
      // Return the require() result directly, just like the test image
      return localImage;
    }
    
    // Otherwise treat as remote URL
    if (__DEV__) {
      console.log(`[TimelineItem] Using remote image URL: ${imageUrl}`);
    }
    return { uri: imageUrl.trim() };
  };

  const imageSource = getImageSource();
  
  // Debug: Log the final image source
  if (__DEV__ && imageSource) {
    console.log(`[TimelineItem] Final imageSource for ${imageUrl}:`, imageSource);
  }

  // Calculate node dimensions
  const borderRadius = 14;
  
  // Generate stable IDs for SVG patterns and clip paths
  const patternId = `imagePattern-${item.id || 'default'}`;
  const clipId = `clip-${item.id || 'default'}`;
  
  // Calculate combined path for node + triangle
  // SVG container width = nodeWidth + triangleDepth + borderWidth (to accommodate border stroke)
  // Path coordinates need to be offset by borderWidth/2 to center the border stroke
  // For left nodes: rectangle at x=borderWidth/2, triangle extends from x=nodeWidth+borderWidth/2, pointing right (toward center)
  // For right nodes: triangle at x=borderWidth/2 pointing left (toward center), rectangle at x=triangleDepth+borderWidth/2
  const nodeX = isLeft ? borderOffset : triangleDepth + borderOffset; // Left nodes start at borderOffset, right nodes start after triangle + borderOffset
  const nodeY = borderOffset;
  
  // Create a path that combines the rounded rectangle and triangle
  // Path format: M (move to), L (line to), A (arc for rounded corners), Z (close path)
  // Note: No rounded corners on the side where triangle connects
  const createCombinedPath = () => {
    if (isLeft) {
      // Left node: rectangle on left, triangle on right edge pointing right (toward center)
      // Start at top-left of rectangle (accounting for border radius)
      const path = `M ${nodeX + borderRadius},${nodeY} `;
      // Top edge of rectangle
      const topEdge = `L ${nodeX + nodeWidth},${nodeY} `;
      // No rounded corner on right side - go directly to triangle
      // Triangle: from top-right of rectangle to triangle tip to bottom-right of rectangle
      const triangleTipX = nodeX + nodeWidth + triangleDepth;
      const triangleTipY = nodeHeightValue / 2 + borderOffset;
      const triangle = `L ${triangleTipX},${triangleTipY} L ${nodeX + nodeWidth},${nodeHeightValue + borderOffset} `;
      // Bottom edge of rectangle (no rounded corner on right side)
      const bottomEdge = `L ${nodeX + borderRadius},${nodeHeightValue + borderOffset} `;
      // Bottom-left rounded corner
      const bottomLeftCorner = `A ${borderRadius} ${borderRadius} 0 0 1 ${nodeX},${nodeHeightValue - borderRadius} `;
      // Left edge back to start
      const leftEdge = `L ${nodeX},${nodeY + borderRadius} A ${borderRadius} ${borderRadius} 0 0 1 ${nodeX + borderRadius},${nodeY} Z`;
      return path + topEdge + triangle + bottomEdge + bottomLeftCorner + leftEdge;
    } else {
      // Right node: triangle on left edge pointing left (toward center), rectangle on right
      // Start at triangle tip (pointing left toward center) - offset by borderOffset
      const triangleTipX = borderOffset;
      const triangleTipY = nodeHeightValue / 2 + borderOffset;
      const path = `M ${triangleTipX},${triangleTipY} `;
      // Triangle: from tip to top-left of rectangle
      const triangleTop = `L ${nodeX},${nodeY} `;
      // Top edge of rectangle (no rounded corner on left side where triangle connects)
      const topEdge = `L ${nodeX + nodeWidth - borderRadius},${nodeY} `;
      // Top-right rounded corner
      const topRightCorner = `A ${borderRadius} ${borderRadius} 0 0 1 ${nodeX + nodeWidth},${nodeY + borderRadius} `;
      // Right edge of rectangle
      const rightEdge = `L ${nodeX + nodeWidth},${nodeHeightValue - borderRadius + borderOffset} `;
      // Bottom-right rounded corner
      const bottomRightCorner = `A ${borderRadius} ${borderRadius} 0 0 1 ${nodeX + nodeWidth - borderRadius},${nodeHeightValue + borderOffset} `;
      // Bottom edge of rectangle (no rounded corner on left side where triangle connects)
      const bottomEdge = `L ${nodeX},${nodeHeightValue + borderOffset} `;
      // Triangle: from bottom-left of rectangle back to tip
      const triangleBottom = `L ${triangleTipX},${triangleTipY} Z`;
      return path + triangleTop + topEdge + topRightCorner + rightEdge + bottomRightCorner + bottomEdge + triangleBottom;
    }
  };
  
  const combinedPath = createCombinedPath();

  return (
    <View style={[
      styles.container,
      styles.absoluteContainer,
      {
        left: isLeft ? leftNodeX : rightNodeX,
      },
    ]}>
      <TouchableOpacity
        style={styles.touchableWrapper}
        onPress={onPress}
        activeOpacity={0.7}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height > 0) {
            setNodeHeight(height);
          }
        }}
      >
        {/* SVG Container for Node and Triangle */}
        {/* Add borderWidth to width to ensure border stroke is not clipped */}
        <Svg
          width={totalNodeWidth + borderWidth}
          height={nodeHeightValue + borderWidth}
          style={styles.svgContainer}
        >
          <Defs>
            {/* Background Image Pattern - Full rectangular area */}
            {showImage && imageSource && typeof imageSource === 'object' && imageSource.uri && (
              <Pattern
                id={patternId}
                patternUnits="userSpaceOnUse"
                width={totalNodeWidth}
                height={nodeHeightValue}
                x={0}
                y={0}
              >
                <SvgImage
                  href={imageSource.uri}
                  width={totalNodeWidth}
                  height={nodeHeightValue}
                  preserveAspectRatio="xMidYMid slice"
                />
              </Pattern>
            )}
          </Defs>

          {/* Full rectangular background with image pattern */}
          {showImage && imageSource && typeof imageSource === 'object' && imageSource.uri ? (
            <>
              {/* Background image as full rectangle - covers entire area including border */}
              <Rect
                x={0}
                y={0}
                width={totalNodeWidth + borderWidth}
                height={nodeHeightValue + borderWidth}
                fill={`url(#${patternId})`}
              />
              {/* Color overlay on image */}
              <Rect
                x={0}
                y={0}
                width={totalNodeWidth + borderWidth}
                height={nodeHeightValue + borderWidth}
                fill="#1A1A2E"
                opacity={0.5}
              />
              {/* Clipping triangles on triangle side to mask image - account for border offset */}
              {isLeft ? (
                // Left node: triangle on right side, clip above and below triangle
                <>
                  {/* Top clipping triangle (right triangle above the node triangle) */}
                  <Polygon
                    points={`${nodeWidth + borderOffset},${borderOffset} ${totalNodeWidth + borderWidth},${borderOffset} ${totalNodeWidth + borderWidth},${nodeHeightValue / 2 + borderOffset}`}
                    fill="#1A1A2E"
                  />
                  {/* Bottom clipping triangle (right triangle below the node triangle) */}
                  <Polygon
                    points={`${nodeWidth + borderOffset},${nodeHeightValue + borderOffset} ${totalNodeWidth + borderWidth},${nodeHeightValue + borderOffset} ${totalNodeWidth + borderWidth},${nodeHeightValue / 2 + borderOffset}`}
                    fill="#1A1A2E"
                  />
                </>
              ) : (
                // Right node: triangle on left side, clip above and below triangle (on left side, horizontally mirrored)
                <>
                  {/* Top clipping triangle (left-pointing triangle above the node triangle) */}
                  <Polygon
                    points={`${borderOffset},${borderOffset} ${triangleDepth + borderOffset},${borderOffset} ${borderOffset},${nodeHeightValue / 2 + borderOffset}`}
                    fill="#1A1A2E"
                  />
                  {/* Bottom clipping triangle (left-pointing triangle below the node triangle) */}
                  <Polygon
                    points={`${borderOffset},${nodeHeightValue + borderOffset} ${triangleDepth + borderOffset},${nodeHeightValue + borderOffset} ${borderOffset},${nodeHeightValue / 2 + borderOffset}`}
                    fill="#1A1A2E"
                  />
                </>
              )}
            </>
          ) : (
            // No image: Just the combined path
            <Path
              d={combinedPath}
              fill="#1A1A2E"
              stroke={itemColor}
              strokeWidth={borderWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Always draw the border stroke on top */}
          <Path
            d={combinedPath}
            fill="transparent"
            stroke={itemColor}
            strokeWidth={borderWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>

        {/* Local Image Overlay (for require() images that SVG can't handle) - Covers entire shape including triangle */}
        {showImage && imageSource && !(typeof imageSource === 'object' && imageSource.uri) && (
          <>
            <Image
              source={imageSource}
              style={[
                styles.localImageOverlay,
                {
                  left: 0,
                  width: totalNodeWidth,
                  height: nodeHeightValue,
                },
              ]}
              resizeMode="cover"
            />
            {/* Color Overlay for Local Images */}
            <View
              style={[
                styles.localColorOverlay,
                {
                  width: totalNodeWidth,
                  height: nodeHeightValue,
                  backgroundColor: '#1A1A2E',
                  opacity: 0.5,
                },
              ]}
            />
            {/* Clipping triangles on triangle side to mask image */}
            <Svg
              width={totalNodeWidth}
              height={nodeHeightValue}
              style={styles.localImageMask}
            >
              {isLeft ? (
                // Left node: triangle on right side, clip above and below triangle
                <>
                  {/* Top clipping triangle (right triangle above the node triangle) */}
                  <Polygon
                    points={`${nodeWidth},0 ${totalNodeWidth},0 ${totalNodeWidth},${nodeHeightValue / 2}`}
                    fill="#1A1A2E"
                  />
                  {/* Bottom clipping triangle (right triangle below the node triangle) */}
                  <Polygon
                    points={`${nodeWidth},${nodeHeightValue} ${totalNodeWidth},${nodeHeightValue} ${totalNodeWidth},${nodeHeightValue / 2}`}
                    fill="#1A1A2E"
                  />
                </>
              ) : (
                // Right node: triangle on left side, clip above and below triangle (on left side, horizontally mirrored)
                <>
                  {/* Top clipping triangle (left-pointing triangle above the node triangle) */}
                  <Polygon
                    points={`0,0 ${triangleDepth},0 0,${nodeHeightValue / 2}`}
                    fill="#1A1A2E"
                  />
                  {/* Bottom clipping triangle (left-pointing triangle below the node triangle) */}
                  <Polygon
                    points={`0,${nodeHeightValue} ${triangleDepth},${nodeHeightValue} 0,${nodeHeightValue / 2}`}
                    fill="#1A1A2E"
                  />
                </>
              )}
            </Svg>
            {/* Border stroke */}
            <Svg
              width={totalNodeWidth}
              height={nodeHeightValue}
              style={styles.localBorderSvg}
            >
              <Path
                d={combinedPath}
                fill="transparent"
                stroke={itemColor}
                strokeWidth={borderWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </Svg>
          </>
        )}

        {/* Content Overlay (Text and Icons) */}
        <View style={styles.contentOverlay}>
          {/* Symbol/Icon - Positioned at triangle tip */}
          {symbol && (
            <View style={[
              styles.symbolContainer, 
              { backgroundColor: itemColor },
              isLeft 
                ? { right: -triangleDepth / 2 - 14 } // Center on triangle tip for left nodes
                : { left: -triangleDepth / 2 - 14 }  // Center on triangle tip for right nodes
            ]}>
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
          <View style={[styles.textContainer, isLeft ? styles.leftTextContainer : styles.rightTextContainer]}>
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
          
          {/* Edit Button - Bottom Left for left nodes, Bottom Right for right nodes */}
          {onEdit && (
            <TouchableOpacity
              style={[
                styles.editButton,
                isLeft ? styles.editButtonLeft : styles.editButtonRight
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Dimensions.get('window').width * 0.49, // Total width including triangle = 49% of screen (in pixels)
    marginVertical: 12,
    alignItems: 'center',
  },
  absoluteContainer: {
    position: 'absolute',
  },
  leftContainer: {
    justifyContent: 'flex-end',
    paddingRight: 0,
    marginRight: 0, // Will be set dynamically to move closer to center
  },
  rightContainer: {
    justifyContent: 'flex-start',
    paddingLeft: 0,
    marginLeft: 0, // Will be set dynamically to move closer to center
  },
  touchableWrapper: {
    position: 'relative',
    width: '100%',
    height: Dimensions.get('window').height * 0.15, // 15% of screen height
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  localImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  localColorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    opacity: 0.15,
    pointerEvents: 'none',
  },
  localImageMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 3,
    pointerEvents: 'none',
  },
  localBorderSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 4,
    pointerEvents: 'none',
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none', // Allow touches to pass through to TouchableOpacity
  },
  symbolContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -14, // Half of height (28/2) to center vertically
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
    justifyContent: 'center',
  },
  leftTextContainer: {
    paddingLeft: 14,
    paddingRight: 14,
  },
  rightTextContainer: {
    paddingLeft: 14,
    paddingRight: 14,
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
  editButton: {
    position: 'absolute',
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 20,
  },
  editButtonLeft: {
    left: 8,
  },
  editButtonRight: {
    right: 8,
  },
  editButtonText: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default TimelineItem;
