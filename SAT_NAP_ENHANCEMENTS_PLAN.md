# Sat Nap Enhancements Plan

## Overview
This plan outlines the enhancements to be made to the **Basic view** of the Timeline App, including zoom functionality, drag-and-drop reordering, theme updates, and UI improvements.

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
- Add zoom in/out buttons in controls (visible only in Basic view)
- Modify `BasicView` to accept and use `zoomScale` prop
- Update node height calculations in `BasicView` based on `zoomScale`:
  - Era height: `screenHeight * 0.30 * zoomScale`
  - Event height: `screenHeight * 0.25 * zoomScale`
  - Scene height: `screenHeight * 0.20 * zoomScale`
- Ensure minimum height of 8% of screen is maintained

**Files to modify**:
- `src/components/TimelineVisualization.js`
- `src/components/BasicView.js`

---

### 2. Drag-and-Drop Reordering
**Goal**: Allow users to reorder timeline items by dragging them in Basic view

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
- Add drag state management (`draggedItem`, `dragPosition`, `dropTarget`) to `BasicView`
- Implement `Gesture.LongPress` and `Gesture.Pan` handlers in `BasicView`
- Add drop target detection logic using item positions
- Create date update modal component
- Implement date validation for historical timelines
- Update `timelineService` methods for reordering:
  - `updateEraOrder()`, `updateEventOrder()`, `updateSceneOrder()`
  - `updateEraDate()`, `updateEventDate()`, `updateSceneDate()`
  - Update parent relationships when moving across levels

**Files to modify**:
- `src/components/BasicView.js`
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
- Review `useSharedValue` usage in components (especially `CardStack.js` and `BasicView.js` if applicable)
- Ensure `useAnimatedStyle` hooks are properly consuming shared values
- Use `runOnUI` for shared value updates if needed
- Only update shared values when values actually change

**Files to modify**:
- `src/components/CardStack.js`
- `src/components/BasicView.js` (if using Reanimated)

---

### 6. Fix Background Image Width
**Goal**: Fix background images not completely filling node width in Basic view

**Requirements**:
- Background images should extend beyond node bounds
- Images should clip at node boundaries
- No consistent gap on right side of nodes
- Apply to accordion-style nodes in Basic view

**Implementation**:
- Modify image styling in `BasicView.js` for era/event/scene nodes
- Ensure images use `resizeMode="cover"` or similar
- Adjust image container styles to extend beyond bounds
- Use proper clipping to ensure images fill completely

**Files to modify**:
- `src/components/BasicView.js`

---

### 7. Prominent Event Dates
**Goal**: Make event dates larger and more prevalent in Basic view

**Requirements**:
- Increase font size for date/time text
- Make date more visually prominent
- Add text shadow for better readability
- Ensure date is clearly visible on background images
- Apply to all node types (Era, Event, Scene) in Basic view

**Implementation**:
- Modify date/time text styles in `BasicView.js`
- Increase `fontSize` (e.g., from 12 to 18)
- Increase `fontWeight` (e.g., to '800' or 'bold')
- Add `textShadowColor`, `textShadowOffset`, `textShadowRadius`
- Adjust positioning if needed

**Files to modify**:
- `src/components/BasicView.js`

---

## Implementation Order

1. **Theme Update** (Task 4) - Quick visual change
2. **Prominent Dates** (Task 7) - Simple style update
3. **Background Image Fix** (Task 6) - Image styling adjustment
4. **Cancel Buttons** (Task 3) - Verify/add buttons
5. **Console Warning Fix** (Task 5) - Debug and fix
6. **Zoom Feature** (Task 1) - More complex, requires BasicView modifications
7. **Drag-and-Drop** (Task 2) - Most complex, requires gesture handlers, state management, and database updates

## Testing Checklist

- [ ] Zoom in/out buttons work correctly in Basic view
- [ ] Pinch-to-zoom gesture works smoothly in Basic view
- [ ] Node height scales correctly (min 8%, max 100%) for Eras, Events, and Scenes
- [ ] Long-press starts drag operation in Basic view
- [ ] Drag visual feedback appears (opacity, scale, border)
- [ ] Drop targets are detected correctly
- [ ] Items can be reordered within same level (Eras, Events, Scenes)
- [ ] Items can be moved across levels (Events between Eras, Scenes between Events)
- [ ] Date update modal appears when needed
- [ ] Date validation works for historical timelines
- [ ] Cancel buttons work in all create screens
- [ ] Theme colors match Roman atlas aesthetic
- [ ] No console warnings
- [ ] Background images fill nodes completely in Basic view
- [ ] Event dates are large and prominent in Basic view
- [ ] Accordion expansion/collapse still works correctly after enhancements

## Notes

- All changes should be made in the `satNapUpdates` branch
- Focus on Basic view (accordion-style) enhancements, not Simple view
- Test on iPad simulator to ensure proper layout
- Ensure backward compatibility with existing timelines
- Consider performance implications of drag-and-drop on large timelines
- Basic view uses accordion-style expansion, so drag-and-drop should work within expanded sections

