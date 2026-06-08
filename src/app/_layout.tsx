import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Platform } from 'react-native';
import { LanguageProvider } from '@/i18n';
import '@/global.css';

export default function RootLayout() {
  return (
    <LanguageProvider>
      {Platform.OS === 'web' && (
        <Head>
          <title>Ghostcar | Aluguel de carros entre pessoas no Brasil</title>
        </Head>
      )}
      <Stack screenOptions={{ headerShown: false }} />
    </LanguageProvider>
  );
}
