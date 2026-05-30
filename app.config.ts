// app.config.ts
import 'dotenv/config';

export default {
  expo: {
    name: "LocalMart",
    slug: "localmart",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    
    // iOS configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourname.localmart",
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST_PATH,
    },
    
    // Android configuration
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FF6B35"
      },
      package: "com.yourname.localmart",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON_PATH,
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    },
    
    // Web configuration
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    
    // Environment variables exposed to app
    extra: {
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      eas: {
        projectId: "your-eas-project-id" // Get from EAS dashboard
      }
    },
    
    plugins: [
      "expo-router",
      "expo-location"
    ]
  }
};