import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'app-comiida',
  webDir: 'www',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '413328046854-s5f9rkffteev8g42rl516sb43fp71klt.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;