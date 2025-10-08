import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.showyo.display',
  appName: 'showyo-dynamic-display',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000"
    }
  }
};

export default config;