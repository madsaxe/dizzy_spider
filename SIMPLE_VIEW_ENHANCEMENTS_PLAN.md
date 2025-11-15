# Simple View Enhancements Plan

## Overview
This plan outlines the enhancements to be made to the Simple view of the Timeline App, including zoom functionality, drag-and-drop reordering, theme updates, and UI improvements.

## Tasks

### 1. Zoom Feature
**Goal**: Add zoom functionality that decreases/increases node height (not actual zoom)

**Requirements**:
- Minimum height: 8% of screen height
- Maximum height: 100% (default size)
- Control methods:
  - Pinch-to-zoom gesture support
  - Zoom in/out buttons (+ and -)
- When zooming in, node height increases
- When zooming out, node height decreases
- More nodes fit on screen when zoomed out

**Implementation**:
- Add `zoomScale` state in `TimelineVisualization.js` (0.08 to 1.0)
- Implement `Gesture.Pinch` for pinch-to-zoom
- Add zoom in/out buttons in controls (visible only in Simple view)
- Modify `HexagonNode` to accept dynamic `hexagonSize` prop
- Update `CardStack` to calculate `currentHexagonSize` based on `zoomScale`
- Replace all hardcoded `HEXAGON_SIZE` references with `currentHexagonSize`

**Files to modify**:
- `src/components/TimelineVisualization.js`
- `src/components/CardStack.js`
- `src/components/HexagonNode.js`

---

### 2. Drag-and-Drop Reordering
**Goal**: Allow users to reorder timeline items by dragging them

**Requirements**:
- Long-press (300ms) on a node to start drag
- Node becomes draggable after long-press
- Visual feedback during drag (opacity, scale, border)
- Drop target detection (highlight potential drop locations)
- Support cross-level dragging:
  - Move Events between Eras
  - Move Scenes between Events
- Date update prompt:
  - If item has start/end date or time, show modal to update date
  - For historical timelines (non-fictional), validate date fits new position
  - Ensure date is before next node and after previous node
- Update order and parent relationships in database

**Implementation**:
- Add drag state management (`draggedItem`, `dragPosition`, `dropTarget`)
- Implement `Gesture.LongPress` and `Gesture.Pan` handlers
- Add drop target detection logic using item positions
- Create date update modal component
- Implement date validation for historical timelines
- Update `timelineService` methods for reordering:
  - `updateEraOrder()`, `updateEventOrder()`, `updateSceneOrder()`
  - `updateEraDate()`, `updateEventDate()`, `updateSceneDate()`
  - Update parent relationships when moving across levels

**Files to modify**:
- `src/components/CardStack.js`
- `src/components/HexagonNode.js`
- `src/components/TimelineVisualization.js`
- `src/services/timelineService.js` (verify methods exist)

---

### 3. Cancel Buttons in Create Dialogues
**Goal**: Add close/cancel buttons to all create/edit dialogue screens

**Requirements**:
- Add Cancel button to:
  - `CreateTimelineScreen`
  - `CreateEraScreen`
  - `CreateEventScreen`
  - `CreateSceneScreen`
- Button should be visible and functional
- Can be in header or at bottom of screen

**Implementation**:
- Verify existing Cancel buttons work correctly
- Add if missing in any create screens

**Files to check/modify**:
- `src/screens/CreateTimelineScreen.js`
- `src/screens/CreateEraScreen.js`
- `src/screens/CreateEventScreen.js`
- `src/screens/CreateSceneScreen.js`

---

### 4. Ancient Roman Atlas Map Theme
**Goal**: Change default theme colors to match an ancient Roman atlas map aesthetic

**Requirements**:
- Update color palette in `TimelineThemeContext`
- Colors should evoke:
  - Parchment/cream background
  - Sepia browns
  - Terracotta reds
  - Deep golds
  - Olive greens
  - Dark brown/black text

**Implementation**:
- Modify `defaultTheme` in `src/context/TimelineThemeContext.js`
- Update:
  - `backgroundColor`: Parchment/cream (#F4E4BC or similar)
  - `cardBackground`: Light parchment (#FAF0E6 or similar)
  - `textColor`: Dark brown/black (#3E2723 or similar)
  - `lineColor`: Sepia brown (#8B6F47 or similar)
  - `itemColors.era`: Terracotta red (#C17A5F or similar)
  - `itemColors.event`: Deep gold (#D4AF37 or similar)
  - `itemColors.scene`: Olive green (#6B8E23 or similar)

**Files to modify**:
- `src/context/TimelineThemeContext.js`

---

### 5. Fix Console Warning
**Goal**: Fix "Sending 'onAnimatedValueUpdate' with no listeners registered" warning

**Requirements**:
- Eliminate console warning: `RCTLog.js 34:23`
- Ensure shared values are properly consumed by animated styles

**Implementation**:
- Review `useSharedValue` usage in `CardStack.js`
- Ensure `useAnimatedStyle` hooks are properly consuming shared values
- Use `runOnUI` for shared value updates if needed
- Only update shared values when values actually change

**Files to modify**:
- `src/components/CardStack.js`

---

### 6. Fix Background Image Width
**Goal**: Fix background images not completely filling node width

**Requirements**:
- Background images should extend beyond node bounds
- Images should clip at node boundaries
- No consistent gap on right side of nodes

**Implementation**:
- Modify SVG `Pattern` and `SvgImage` in `HexagonNode.js`
- Extend image dimensions beyond hexagon bounds
- Adjust `x` and `y` offsets to center extended image
- Ensure `preserveAspectRatio="xMidYMid slice"` for proper clipping

**Files to modify**:
- `src/components/HexagonNode.js`

---

### 7. Prominent Event Dates
**Goal**: Make event dates larger and more prevalent in Simple view

**Requirements**:
- Increase font size for date/time text
- Make date more visually prominent
- Add text shadow for better readability
- Ensure date is clearly visible on background images

**Implementation**:
- Modify `timeText` style in `HexagonNode.js`
- Increase `fontSize` (e.g., from 12 to 18)
- Increase `fontWeight` (e.g., to '800' or 'bold')
- Add `textShadowColor`, `textShadowOffset`, `textShadowRadius`
- Adjust positioning if needed

**Files to modify**:
- `src/components/HexagonNode.js`

---

## Implementation Order

1. **Theme Update** (Task 4) - Quick visual change
2. **Prominent Dates** (Task 7) - Simple style update
3. **Background Image Fix** (Task 6) - SVG pattern adjustment
4. **Cancel Buttons** (Task 3) - Verify/add buttons
5. **Console Warning Fix** (Task 5) - Debug and fix
6. **Zoom Feature** (Task 1) - More complex, requires multiple file changes
7. **Drag-and-Drop** (Task 2) - Most complex, requires gesture handlers, state management, and database updates

## Testing Checklist

- [ ] Zoom in/out buttons work correctly
- [ ] Pinch-to-zoom gesture works smoothly
- [ ] Node height scales correctly (min 8%, max 100%)
- [ ] Long-press starts drag operation
- [ ] Drag visual feedback appears (opacity, scale, border)
- [ ] Drop targets are detected correctly
- [ ] Items can be reordered within same level
- [ ] Items can be moved across levels (Events between Eras, Scenes between Events)
- [ ] Date update modal appears when needed
- [ ] Date validation works for historical timelines
- [ ] Cancel buttons work in all create screens
- [ ] Theme colors match Roman atlas aesthetic
- [ ] No console warnings
- [ ] Background images fill nodes completely
- [ ] Event dates are large and prominent

## Notes

- All changes should be made in the `simple-view-enhancements` branch
- Test on iPad simulator to ensure proper layout
- Ensure backward compatibility with existing timelines
- Consider performance implications of drag-and-drop on large timelines

