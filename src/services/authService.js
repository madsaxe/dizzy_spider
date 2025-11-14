import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

class AuthService {
  constructor() {
    // Configure Google Sign-In
    // Note: webClientId is the Web Client ID from Firebase Console
    // The reversed client ID (com.googleusercontent.apps.xxx) should be in Info.plist
    GoogleSignin.configure({
      webClientId: '1045184350964-rqcqtnfp4642lok73l8c9kasifuqs807.apps.googleusercontent.com',
      // If you have a separate iOS Client ID, add it here:
      // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    });
  }

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} User object
   */
  async signInWithEmail(email, password) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      };
    } catch (error) {
      console.error('Email sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Register new user with email and password
   * @param {string} email
   * @param {string} password
   * @param {string} displayName
   * @returns {Promise<Object>} User object
   */
  async registerWithEmail(email, password, displayName = null) {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await userCredential.user.updateProfile({ displayName });
      }

      // Create user document in Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName || userCredential.user.displayName,
      };
    } catch (error) {
      console.error('Email registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google
   * @returns {Promise<Object>} User object
   */
  async signInWithGoogle() {
    try {
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the user's ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign in with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);

      // Create or update user document in Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        lastLogin: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Apple (iOS only)
   * Note: Requires native Apple Sign-In setup in iOS project
   * @param {string} identityToken - Apple identity token from native sign-in
   * @param {string} nonce - Nonce used for Apple sign-in
   * @param {string} fullName - User's full name (optional)
   * @returns {Promise<Object>} User object
   */
  async signInWithApple(identityToken, nonce, fullName = null) {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS');
      }

      // Create a Firebase credential with the Apple token
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      // Sign in with the credential
      const userCredential = await auth().signInWithCredential(appleCredential);

      // Create or update user document in Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email: userCredential.user.email,
        displayName: fullName || userCredential.user.displayName,
        lastLogin: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: fullName || userCredential.user.displayName,
      };
    } catch (error) {
      console.error('Apple sign in error:', error);
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        throw new Error('Apple sign in was canceled');
      }
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      // Sign out from Google if signed in
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }
      
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    const user = auth().currentUser;
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }

  /**
   * Listen to auth state changes
   * @param {Function} callback - Callback function with user object or null
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    return auth().onAuthStateChanged((user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Reset password via email
   * @param {string} email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Handle authentication errors and return user-friendly messages
   * @param {Error} error
   * @returns {Error}
   */
  handleAuthError(error) {
    let message = 'An error occurred during authentication';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      default:
        message = error.message || message;
    }
    
    const newError = new Error(message);
    newError.code = error.code;
    return newError;
  }
}

export default new AuthService();

