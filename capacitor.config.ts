import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idxterminal.app',
  appName: 'IDX Stock Terminal',
  webDir: 'public',
  server: {
    url: 'https://idx-stock-terminal.vercel.app/dashboard',
    cleartext: true
  }
};

export default config;
