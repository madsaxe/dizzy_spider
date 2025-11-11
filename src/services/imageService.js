import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

class ImageService {
  /**
   * Request camera permission for Android
   */
  async requestCameraPermission() {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'TimelineApp needs access to your camera to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  /**
   * Request storage permission for Android
   */
  async requestStoragePermission() {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'TimelineApp needs access to your storage to select images.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  /**
   * Pick image from gallery
   * @returns {Promise<string|null>} Image URI or null if cancelled
   */
  async pickImageFromGallery() {
    const hasPermission = await this.requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required to select images.');
      return null;
    }

    return new Promise((resolve) => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1920,
        },
        (response) => {
          if (response.didCancel) {
            resolve(null);
          } else if (response.errorMessage) {
            Alert.alert('Error', response.errorMessage);
            resolve(null);
          } else if (response.assets && response.assets[0]) {
            resolve(response.assets[0].uri);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Take photo with camera
   * @returns {Promise<string|null>} Image URI or null if cancelled
   */
  async takePhoto() {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return null;
    }

    return new Promise((resolve) => {
      launchCamera(
        {
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1920,
        },
        (response) => {
          if (response.didCancel) {
            resolve(null);
          } else if (response.errorMessage) {
            Alert.alert('Error', response.errorMessage);
            resolve(null);
          } else if (response.assets && response.assets[0]) {
            resolve(response.assets[0].uri);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Show image picker options (gallery or camera)
   * @returns {Promise<string|null>} Image URI or null if cancelled
   */
  async showImagePicker() {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const uri = await this.takePhoto();
              resolve(uri);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const uri = await this.pickImageFromGallery();
              resolve(uri);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Get image URI - for now just return the URI as-is
   * In the future, could copy to app directory for persistence
   * @param {string} uri - Image URI
   * @returns {string} Image URI
   */
  getImageUri(uri) {
    if (!uri) return null;
    // For now, return URI as-is
    // TODO: Could implement copying to app directory for better persistence
    return uri;
  }
}

export default new ImageService();

