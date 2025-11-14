# Quick Start - New Features

## What's New

Your Timeline App now has three major new features:

1. **Authentication** - Login with email/password, Google, or Apple
2. **CSV Import/Export** - Export timelines to CSV and import them back
3. **Timeline Sharing** - Share timelines with view-only or editable access

## Immediate Next Steps

### 1. Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

### 2. Configure Firebase (Required)

**Create Firebase Project:**
1. Go to https://console.firebase.google.com/
2. Create a new project
3. Add iOS app with your bundle ID
4. Download `GoogleService-Info.plist`
5. Add it to your Xcode project (drag into project navigator)

**Enable Authentication:**
- Go to Authentication > Sign-in method
- Enable Email/Password
- Enable Google (get Web Client ID)
- Enable Apple (iOS only)

**Enable Firestore:**
- Go to Firestore Database
- Create database in test mode

### 3. Update Google Sign-In Config

Edit `src/services/authService.js` line 11:
```javascript
GoogleSignin.configure({
  webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID_HERE',
});
```

### 4. Test the App

```bash
npm start
# In another terminal:
npm run ios
```

## Feature Usage

### Authentication
- App now requires login
- Existing timelines will be assigned to your account on first login
- Use email/password, Google, or Apple Sign-In

### Export Timeline
1. Go to Timeline List
2. Click "Export" on any timeline
3. Share the CSV file

### Import Timeline
1. Go to Timeline List
2. Click "Import" button
3. Select a CSV file
4. Preview and confirm

### Share Timeline
1. Open any timeline
2. Click the share icon (top right)
3. Choose "View Only" or "Editable"
4. Share the link

## Important Notes

- **Firebase is required** - The app won't work without Firebase configuration
- **Google Sign-In** - Requires Web Client ID configuration
- **Apple Sign-In** - Currently placeholder, needs native implementation
- **Deep Linking** - Shared timeline URLs need deep link configuration (optional)

## Troubleshooting

**App crashes on startup:**
- Check Firebase is initialized
- Verify `GoogleService-Info.plist` is in Xcode project
- Run `pod install` in ios directory

**Authentication not working:**
- Verify Firebase Authentication is enabled
- Check Google Sign-In Web Client ID is set
- Check network connectivity

**CSV import/export issues:**
- Check file permissions
- Verify CSV format matches expected structure

See `SETUP_GUIDE.md` for detailed setup instructions.

