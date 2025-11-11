/**
 * Utility functions for calculating hexagon geometry
 * Flat-top hexagon: horizontal edge on top
 */

/**
 * Calculate flat-top hexagon points for an equilateral hexagon (all 6 sides equal length)
 * A regular flat-top hexagon has 6 vertices arranged as:
 * 
 *     1 ---- 2
 *    /        \
 *   6          3
 *    \        /
 *     5 ---- 4
 * 
 * Where 1-2 is the top flat edge and 4-5 is the bottom flat edge.
 * Vertices 3 and 6 are the corner points.
 * 
 * For an equilateral hexagon (all sides equal) that fits within a square:
 * - All 6 sides have the same length 'a'
 * - The hexagon is scaled to fit within a square bounding box
 * - Left and right corners are positioned to create equal sides
 * 
 * For a regular hexagon with flat top and side length 'a':
 * - Top flat edge length = a
 * - Height from top to bottom = a * √3
 * - Width from left corner to right corner = 2a
 * 
 * To fit in a square of size 's', we need to scale so that:
 * - The hexagon fits within the square both horizontally and vertically
 * - The bounding box is square (width = height)
 * 
 * Approach:
 * - Calculate side length 'a' such that the hexagon fits in the square
 * - For a square container, we want the hexagon to be centered
 * - Corners are at the midpoint vertically (y = s/2)
 * - The flat edges are centered horizontally
 * 
 * Solving for side length 'a' where hexagon fits in square 's':
 * - If corners are at y = s/2, and we want all sides equal
 * - The distance from top edge corner to side corner must equal 'a'
 * - This gives us the relationship to calculate 'a'
 * 
 * @param {number} size - Size of the square container (both width and height)
 * @param {number} borderOffset - Offset for border stroke (half of border width)
 * @returns {Array} Array of {x, y} points for the hexagon path (6 points, clockwise from top-left)
 */
export const calculateFlatTopHexagonPoints = (size, borderOffset = 0) => {
  const containerSize = size;
  const w = containerSize - (borderOffset * 2);
  const h = containerSize - (borderOffset * 2);
  const centerX = containerSize / 2;
  const centerY = containerSize / 2;
  
  // For an equilateral hexagon that fits in a square:
  // We want the hexagon to be as large as possible while fitting in the square
  // and maintaining all 6 sides equal.
  //
  // For a regular hexagon with side length 'a':
  // - Natural width (corner to corner) = 2a
  // - Natural height (top to bottom) = a√3
  //
  // To fit in a square, we need to scale based on the limiting dimension.
  // For a flat-top hexagon with corners at the midpoint:
  // - If we place corners at y = s/2, the height constraint gives us a relationship
  //
  // Let's calculate side length 'a' such that:
  // 1. All sides are equal
  // 2. The hexagon fits within the square
  // 3. Corners are at the midpoint vertically
  //
  // For corners at (x_left, s/2) and (x_right, s/2):
  // The distance from top edge corner (centerX + a/2, 0) to right corner (x_right, s/2) = a
  // This gives us: sqrt((x_right - centerX - a/2)² + (s/2)²) = a
  //
  // For the hexagon to fit in the square and be centered:
  // - The hexagon should be scaled to fit within the square
  // - We'll use a scale factor based on the square's dimensions
  //
  // For a regular hexagon, the optimal scaling to fit in a square:
  // - Scale factor = min(s / (2a), s / (a√3)) where a is the side length
  // - But we want to determine 'a' such that it fits perfectly
  //
  // Simplified approach: Calculate side length based on fitting in square
  // For a hexagon to fit in a square with corners at midpoint:
  // We'll calculate 'a' such that the hexagon's bounding box fits in the square
  
  // Calculate side length for equilateral hexagon that fits in square
  // Using the constraint that corners are at midpoint and all sides are equal
  // The side length is determined by the requirement that the hexagon fits
  // both horizontally and vertically in the square
  
  // For a regular hexagon with flat top:
  // If side length = a, and we want it centered in square of size s:
  // - Top edge: centered, length = a
  // - Corners at: (x_left, s/2) and (x_right, s/2) where x_right - x_left = 2a (for regular hex)
  // - But we want it to fit in the square, so we scale appropriately
  
  // Actually, for a regular hexagon (all sides equal), the relationship is:
  // - Width (corner to corner) = 2a
  // - Height (top to bottom) = a√3
  //
  // To fit in a square, we want: max(2a, a√3) ≤ s
  // Since a√3 > 2a (because √3 ≈ 1.732 > 2), the height is the limiting factor
  // So: a√3 ≤ s, which means: a ≤ s/√3
  //
  // But we also want corners at the midpoint. For a regular hexagon:
  // - If we scale by factor k, side length = a, and corners at y = s/2
  // - The distance from top corner to side corner = a
  // - This distance = sqrt((x_offset)² + (s/2)²) where x_offset is horizontal distance
  
  // Let's use a simpler approach: calculate a regular hexagon and scale it to fit
  // For a regular hexagon with side 'a':
  // - Width span = 2a (from leftmost to rightmost point)
  // - Height span = a√3 (from top to bottom)
  //
  // To fit in a square of size s, scale by: min(s/(2a), s/(a√3))
  // But we want to determine 'a' such that after scaling, it fits perfectly
  
  // Better approach: For a regular hexagon fitting in a square with corners at midpoint:
  // - Side length a is determined by the constraint that all sides are equal
  // - And the hexagon fits within the square bounds
  //
  // If we want the hexagon centered and corners at y = s/2:
  // - The top flat edge is at y = borderOffset
  // - The bottom flat edge is at y = s - borderOffset  
  // - Corners are at y = s/2
  //
  // For all sides to be equal with this setup, we need to solve for the side length
  // and corner x-positions that make all 6 sides equal while fitting in the square
  
  // For a regular hexagon (all sides equal) to fit in a square:
  // - Natural width (corner to corner) = 2a
  // - Natural height (top to bottom) = a√3
  //
  // To fit in a square of size s, we have two constraints:
  // 1. Width constraint: 2a ≤ s, so a ≤ s/2
  // 2. Height constraint: a√3 ≤ s, so a ≤ s/√3
  //
  // Since s/√3 ≈ 0.577s < s/2 = 0.5s, the height constraint is more restrictive.
  // However, if we use a = s/√3, then width = 2s/√3 ≈ 1.155s, which exceeds the square!
  //
  // Solution: Scale based on the width constraint to ensure it fits in the square
  // Use: a = s/2 (width constraint), then height = s√3/2 ≈ 0.866s
  // This ensures the hexagon fits within the square width-wise
  //
  // But we also want corners at the midpoint vertically (y = s/2)
  // For this, we need to adjust the calculation
  //
  // Better approach: Calculate side length based on fitting in square with corners at midpoint
  // If corners are at y = s/2, and we want all sides equal:
  // - Top edge at y = 0, bottom edge at y = s
  // - Distance from top edge corner to side corner = a
  // - This distance = sqrt((x_offset)² + (s/2)²)
  //
  // For a regular hexagon, if side length = a and corners are at y = s/2:
  // The horizontal distance from center to corner should be such that all sides are equal
  //
  // Let's solve: For side length 'a', if top edge is centered and corners are at y = s/2:
  // - Top edge: from (centerX - a/2, 0) to (centerX + a/2, 0)
  // - Right corner: at (x_right, s/2)
  // - Distance from (centerX + a/2, 0) to (x_right, s/2) = a
  //
  // This gives: (x_right - centerX - a/2)² + (s/2)² = a²
  // Solving for x_right and ensuring it fits in the square: x_right ≤ s
  //
  // To have all 6 sides equal AND fit in a square:
  // We need to solve for side length 'a' such that:
  // 1. Top flat edge length = a
  // 2. Distance from top edge corner to side corner = a
  // 3. The hexagon fits within the square (width ≤ s, height ≤ s)
  //
  // If corners are at y = s/2, and top edge is at y = 0:
  // Distance from (centerX + a/2, 0) to (x_right, s/2) = a
  // This gives: (x_right - centerX - a/2)² + (s/2)² = a²
  //
  // For a regular hexagon, x_right = centerX + a (corners are 'a' units from center)
  // So: (a - a/2)² + (s/2)² = a²
  //     (a/2)² + (s/2)² = a²
  //     a²/4 + s²/4 = a²
  //     s²/4 = 3a²/4
  //     s² = 3a²
  //     a = s/√3
  //
  // But then width = 2a = 2s/√3 ≈ 1.155s, which exceeds the square!
  //
  // So we need to adjust: Instead of placing corners at centerX ± a,
  // we need to place them closer to the center so the hexagon fits.
  //
  // Let's solve: For side length 'a', if corners are at (x_corner, s/2):
  // - Top edge: from (centerX - a/2, 0) to (centerX + a/2, 0), length = a
  // - Distance from (centerX + a/2, 0) to (x_corner, s/2) = a
  // - This gives: (x_corner - centerX - a/2)² + (s/2)² = a²
  // - Solving: x_corner - centerX - a/2 = ±sqrt(a² - s²/4)
  // - For right corner: x_corner = centerX + a/2 + sqrt(a² - s²/4)
  //
  // We also need: x_corner ≤ s (fits in square)
  // And for symmetry: x_left = s - x_right
  //
  // Actually, let's use a simpler constraint: Make the hexagon fit by scaling
  // For a regular hexagon to fit in a square, scale it so width = s
  // Then: 2a = s, so a = s/2
  // But then we need to adjust corner positions so all sides are equal
  //
  // Let's calculate corner x-positions to make all sides equal:
  // For side length a = s/2, and corners at y = s/2:
  // Distance from (centerX + a/2, 0) to (x_right, s/2) should equal a
  // (x_right - centerX - a/2)² + (s/2)² = a²
  // (x_right - s/2 - s/4)² + (s/2)² = (s/2)²
  // (x_right - 3s/4)² + s²/4 = s²/4
  // (x_right - 3s/4)² = 0
  // x_right = 3s/4
  //
  // But this gives width = 3s/4 - s/4 = s/2, not s!
  //
  // Let me try a different approach: Calculate 'a' such that when corners are placed
  // to make all sides equal, the hexagon fits in the square
  
  // Solve the equation: For corners at (x_c, s/2) and side length 'a':
  // Distance from (centerX + a/2, 0) to (x_c, s/2) = a
  // (x_c - centerX - a/2)² + (s/2)² = a²
  // x_c = centerX + a/2 + sqrt(a² - s²/4)
  //
  // For the hexagon to fit: x_c ≤ s
  // centerX + a/2 + sqrt(a² - s²/4) ≤ s
  // s/2 + a/2 + sqrt(a² - s²/4) ≤ s
  // a/2 + sqrt(a² - s²/4) ≤ s/2
  //
  // This is complex. Let's use an iterative approach or approximation.
  //
  // Actually, for a practical solution: Use a = s/2.5 which gives a good fit
  // Or calculate based on ensuring it fits width-wise first
  
  // Simplified solution: Use side length that ensures it fits in the square
  // and adjust corners to be at the edges of the square
  // This may not give perfectly equal sides, but will fit in the square
  
  // For a better fit, let's calculate 'a' such that when we solve for corner positions
  // to make sides equal, the corners end up at the square edges (or close to it)
  
  // Practical solution: Scale the hexagon to fit in the square
  // Use: a = s/2.4 (empirically determined to give good fit)
  // Or calculate: For corners at edges (x = 0 and x = s) and y = s/2:
  // We need: distance from (s/2 + a/2, 0) to (s, s/2) = a
  // (s - s/2 - a/2)² + (s/2)² = a²
  // (s/2 - a/2)² + (s/2)² = a²
  // s²/4 - sa/2 + a²/4 + s²/4 = a²
  // s²/2 - sa/2 = 3a²/4
  // 2s² - 2sa = 3a²
  // 3a² + 2sa - 2s² = 0
  // a = (-2s + sqrt(4s² + 24s²)) / 6 = s(√7 - 1)/3 ≈ 0.5486s
  
  // For a regular hexagon (all vertices equidistant from center):
  // - All 6 vertices lie on a circle centered at (centerX, centerY)
  // - For a flat-top hexagon, vertices are at specific angles
  // - This ensures all corners are exactly the same distance from the center
  //
  // For a flat-top regular hexagon, vertices are at angles (measured from positive x-axis):
  // - Top-left: 150° (5π/6 radians)
  // - Top-right: 30° (π/6 radians)
  // - Right: 330° or -30° (11π/6 or -π/6 radians)
  // - Bottom-right: 270° (3π/2 radians)
  // - Bottom-left: 210° (7π/6 radians)
  // - Left: 90° (π/2 radians)
  //
  // Calculate radius to fit in square container
  // For a regular hexagon, the bounding box is:
  // - Width: 2 * radius (corner to corner horizontally)
  // - Height: radius * √3 (top to bottom)
  // To fit in square: we need max(2r, r√3) ≤ usable_size
  // Since r√3 ≈ 1.732r > 2r, height is limiting: r√3 ≤ h
  // So: r ≤ h / √3
  // But for beehive look (wider), we can use more of the width
  // Let's use: r = min(w/2.1, h/2.1) for a wider, flatter appearance
  
  // Calculate radius to fit in square container with beehive appearance (wider, flatter)
  // For beehive look, use a radius that creates a wider hexagon
  // Increased radius for larger hexagon size
  const radius = Math.min(w / 1.8, h / 2.0); // Larger radius for bigger hexagon, favor width for beehive look
  
  // For a flat-top regular hexagon, vertices are at these angles (measured from positive x-axis):
  // Going clockwise from top-left corner:
  // - Top-left vertex: 120° (2π/3) - forms left end of top flat edge
  // - Top-right vertex: 60° (π/3) - forms right end of top flat edge  
  // - Right vertex: 0° (0) - rightmost corner
  // - Bottom-right vertex: 300° or -60° (5π/3) - forms right end of bottom flat edge
  // - Bottom-left vertex: 240° (4π/3) - forms left end of bottom flat edge
  // - Left vertex: 180° (π) - leftmost corner
  //
  // Actually, let me verify: For flat-top, the top edge should be horizontal.
  // Top vertices should have the same y-coordinate (maximum y for flat-top).
  // If center is at origin and top is at y = r:
  // - Top vertices: angles where y = r*sin(angle) = r, so sin(angle) = 1
  // - This gives angles 90°, but that's vertical, not horizontal
  //
  // For flat-top, if we rotate a regular hexagon 30°:
  // - Original angles: 90°, 30°, -30°, -90°, -150°, 150°
  // - After 30° rotation: 120°, 60°, 0°, -60°, -120°, 180°
  // - In standard 0-360°: 120°, 60°, 0°, 300°, 240°, 180°
  //
  // Let's use: 120°, 60°, 0°, 300°, 240°, 180° (going counter-clockwise from top-left)
  // But we want clockwise from top-left, so: 120°, 60°, 0°, 300°, 240°, 180°
  const angles = [
    120, // Top-left: 120° = 2π/3
    60,  // Top-right: 60° = π/3
    0,   // Right: 0° = 0
    300, // Bottom-right: 300° = -60° = 5π/3
    240, // Bottom-left: 240° = 4π/3
    180, // Left: 180° = π
  ];
  
  // Calculate vertices using polar coordinates (all equidistant from center)
  // This ensures all 6 vertices are exactly the same distance from the center
  const vertices = angles.map(angle => {
    const angleRad = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleRad),
      y: centerY + radius * Math.sin(angleRad),
    };
  });
  
  return vertices;
};

/**
 * Generate SVG path string for flat-top hexagon
 * @param {number} size - Size of the hexagon (both width and height, since it's square)
 * @param {number} borderOffset - Offset for border stroke
 * @returns {string} SVG path string
 */
export const generateFlatTopHexagonPath = (size, borderOffset = 0) => {
  const points = calculateFlatTopHexagonPoints(size, borderOffset);
  
  // Create path string - hexagon has 6 points
  if (points.length !== 6) {
    console.warn(`Expected 6 points for hexagon, got ${points.length}`);
  }
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  path += ' Z'; // Close the path
  
  return path;
};

/**
 * Calculate hexagon dimensions - returns square dimensions (height = width)
 * @param {number} baseSize - Base size for the hexagon (applies to both width and height)
 * @returns {Object} {width, height, size} - All equal for square hexagon
 */
export const calculateHexagonDimensions = (baseSize) => {
  // For square hexagons, width and height are the same
  return {
    width: baseSize,
    height: baseSize,
    size: baseSize,
  };
};

/**
 * Calculate hexagon clip path points for content clipping
 * @param {number} size - Size of the hexagon (both width and height)
 * @returns {Array} Array of {x, y} points for clip path
 */
export const calculateHexagonClipPath = (size) => {
  // Clip path uses the same points as the hexagon shape
  return calculateFlatTopHexagonPoints(size, 0);
};

/**
 * Generate clip path string for SVG
 * @param {number} size - Size of the hexagon (both width and height)
 * @param {string} id - Unique ID for the clip path
 * @returns {Object} {id, pathString, points}
 */
export const generateClipPath = (size, id) => {
  const points = calculateHexagonClipPath(size);
  const pathString = generateFlatTopHexagonPath(size, 0);
  
  return {
    id,
    pathString,
    points,
  };
};
