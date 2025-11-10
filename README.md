# Timeline App

A React Native iOS app for creating and managing timelines with real or fictional time. Features hierarchical organization (Era > Event > Scene) and gamification elements.

## Features

- **Create Timelines**: Build timelines for real historical events or fictional stories
- **Hierarchical Structure**: Organize content into Eras, Events, and Scenes
- **Flexible Time Input**: Use real dates or fictional time strings
- **Relative Positioning**: Place items before/after others without specific times
- **Gamification**: Earn points and unlock achievements as you build timelines
- **Local Storage**: All data is stored locally on your device

## Project Structure

```
TimelineApp/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   ├── services/         # Business logic and data services
│   ├── models/           # Data models
│   ├── utils/            # Utility functions
│   └── context/          # React Context for state management
├── App.js                # Main app component with navigation
└── package.json          # Dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher) - [Install Node.js](https://nodejs.org/)
- npm or yarn
- Xcode (for iOS development) - Install from App Store
- CocoaPods (for iOS dependencies) - `sudo gem install cocoapods`

### Quick Start

**If Node.js is already installed:**

```bash
# Install dependencies
npm install

# If iOS folder exists, install CocoaPods dependencies
cd ios && pod install && cd ..

# Run the app
npm run ios
```

**If this is a fresh setup:**

1. First, ensure Node.js is installed (see [INSTALLATION.md](./INSTALLATION.md))
2. Run the initialization script:
   ```bash
   ./init-project.sh
   ```
3. Or follow the detailed guide in [INSTALLATION.md](./INSTALLATION.md)

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Install iOS dependencies (if ios folder exists):
```bash
cd ios
pod install
cd ..
```

3. Run the app:
```bash
npm run ios
# or
yarn ios
```

**Note:** If you don't have an `ios` folder, you'll need to initialize the React Native project first. See [INSTALLATION.md](./INSTALLATION.md) for details.

## Usage

### Creating a Timeline

1. Tap the "+" button on the Timeline List screen
2. Enter a title and optional description
3. Choose whether it's a fictional or historical timeline
4. Tap "Create Timeline"

### Adding Content

- **Eras**: Large spans of time (e.g., "Medieval Period", "The Great War Era")
- **Events**: Things that happen within an Era (e.g., "Battle of Hastings", "First Contact")
- **Scenes**: Specific moments within an Event (e.g., "The King's Speech", "The Discovery")

### Time Input

- **Real Dates**: Use the date picker for historical timelines
- **Fictional Time**: Enter text like "Year 3000" or "Before the Great War"
- **Relative Positioning**: Place items before/after other items without specifying a time

### Gamification

Earn points and unlock achievements by:
- Creating timelines
- Adding eras, events, and scenes
- Reaching milestones (10 events, 100 events, etc.)

## Technologies Used

- React Native
- React Navigation
- AsyncStorage
- React Native Date Picker
- React Native Vector Icons

## Development

The app uses:
- **React Context** for global state management
- **AsyncStorage** for local data persistence
- **React Navigation** for screen navigation
- **Custom components** for timeline visualization

## Future Enhancements

- Drag-and-drop reordering
- Export/import timelines
- Sharing timelines with others
- Cloud sync
- Advanced visualization options

