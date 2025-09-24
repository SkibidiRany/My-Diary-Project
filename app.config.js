// app.config.js
const IS_WEB = process.env.EXPO_PLATFORM === 'web';

const googleSignInPlugin = [
  "@react-native-google-signin/google-signin",
  {
    "iosUrlScheme": "com.googleusercontent.apps.839189975914-vof7lpkkug46b7htfeu91go6borelp81"
  }
];

const plugins = [
  "expo-sqlite",
  "expo-image-picker"
];

if (!IS_WEB) {
  plugins.push(googleSignInPlugin);
}

export default {
  "expo": {
    "name": "DiaryApp",
    "slug": "DiaryApp",
    "scheme": "com.rany.mydiaryapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.rany.mydiaryapp",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": plugins,
    "extra": {
      "eas": {
        "projectId": "c49bf83d-1db1-4c22-8dbf-8ccdf7c12a2d"
      }
    }
  }
};