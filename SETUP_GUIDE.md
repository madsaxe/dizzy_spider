# Timeline App - Import/Export/Sharing Setup Guide

This guide covers the setup required for the new features: Authentication, CSV Import/Export, and Timeline Sharing.

## Features Implemented

✅ **Authentication System**
- Email/Password authentication
- Google Sign-In (SSO)
- Apple Sign-In (SSO) - iOS only
- User account management with Firestore

✅ **CSV Import/Export**
- Export timelines with full hierarchy (Timeline → Era → Event → Scene)
- All user-fillable fields included
- Image handling (base64 encoding)
- Import with file picker and preview

✅ **Timeline Sharing**
- Shareable links with unique IDs
- View-only or editable sharing options
- Firestore-based sharing service
- Shared timeline viewing

## Required Setup

### 1. Firebase Configuration

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication:
   - Go to **Authentication** > **Sign-in method**
   - Enable **Email/Password**
   - Enable **Google** (configure OAuth consent screen)
   - Enable **Apple** (iOS only, requires Apple Developer account)

#### Add iOS App to Firebase
1. In Firebase Console, click "Add app" > iOS
2. Register your app with bundle ID
3. Download `GoogleService-Info.plist`
4. Add `GoogleService-Info.plist` to your Xcode project:
   - Drag it into the project navigator
   - Make sure "Copy items if needed" is checked
   - Add to target: TimelineApp

#### Add Android App to Firebase (if needed)
1. In Firebase Console, click "Add app" > Android
2. Register your app with package name
3. Download `google-services.json`
4. Place it in `android/app/` directory

#### Enable Firestore
1. Go to **Firestore Database** in Firebase Console
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location for your database

### 2. Google Sign-In Configuration

1. In Firebase Console, go to **Authentication** > **Sign-in method** > **Google**
2. Enable Google Sign-In
3. Get your **Web client ID** from the OAuth 2.0 Client IDs section
4. Update `src/services/authService.js`:
   ```javascript
   GoogleSignin.configure({
     webClientId: 'YOUR_WEB_CLIENT_ID_HERE', // Replace with your actual client ID
   });
   ```

### 3. Apple Sign-In Configuration (iOS Only)

1. In Xcode, select your project
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **Sign in with Apple**
5. In Firebase Console, enable Apple Sign-In in Authentication settings

**Note:** Apple Sign-In requires:
- Active Apple Developer account
- App configured with Sign in with Apple capability
- Native implementation (currently placeholder in LoginScreen)

### 4. iOS Pod Installation

After adding Firebase dependencies, run:
```bash
cd ios
pod install
cd ..
```

### 5. Deep Linking Configuration (Optional)

To enable shared timeline links to open the app:

#### iOS (Info.plist)
Add URL scheme to `ios/TimelineApp/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>timelineapp</string>
    </array>
  </dict>
</array>
```

#### Handle Deep Links in App.js
Add deep link handling to navigate to shared timelines when the app opens via a link.

## Testing

### Test Authentication
1. Run the app
2. You should see the Login screen
3. Try creating an account with email/password
4. Try Google Sign-In (after configuring)
5. Try Apple Sign-In on iOS (after configuring)

### Test CSV Export
1. Create a timeline with eras, events, and scenes
2. Go to Timeline List
3. Click "Export" on a timeline
4. Share the CSV file

### Test CSV Import
1. Go to Timeline List
2. Click "Import" button
3. Select a previously exported CSV file
4. Preview and confirm import

### Test Sharing
1. Open a timeline
2. Click the share icon (export-variant)
3. Choose "View Only" or "Editable"
4. Share the link
5. Open the shared link in another device/session

## Troubleshooting

### Firebase Not Initialized
- Ensure `GoogleService-Info.plist` is in the Xcode project
- Check that Firebase is properly initialized in your app entry point

### Google Sign-In Not Working
- Verify `webClientId` is set correctly in `authService.js`
- Check that Google Sign-In is enabled in Firebase Console
- Ensure OAuth consent screen is configured

### Apple Sign-In Not Working
- Verify Sign in with Apple capability is added in Xcode
- Check that Apple Sign-In is enabled in Firebase Console
- Native Apple Sign-In button needs to be implemented (currently placeholder)

### CSV Import/Export Issues
- Check file permissions
- Verify CSV format matches expected structure
- Check console for parsing errors

### Sharing Not Working
- Verify Firestore is enabled and accessible
- Check network connectivity
- Verify Firestore security rules allow read/write operations

## Security Rules (Firestore)

For development, you can use test mode. For production, set up proper security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Shared timelines collection
    match /sharedTimelines/{shareId} {
      allow read: if true; // Anyone can read shared timelines
      allow write: if request.auth != null && 
                     request.resource.data.ownerId == request.auth.uid;
    }
  }
}
```

## Next Steps

1. Configure Firebase project and add credentials
2. Test authentication flows
3. Test CSV import/export
4. Test timeline sharing
5. Set up proper Firestore security rules for production
6. Implement native Apple Sign-In button (if needed)
7. Configure deep linking for shared timeline URLs

