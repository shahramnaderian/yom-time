import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.yomtime.owghat',
  appName: 'yomeah',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#C22928'
    }
  },
  android: {
    backgroundColor: '#FFF7F4'
  }
};

export default config;
