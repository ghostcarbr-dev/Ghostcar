import { Stack } from 'expo-router';
import { LanguageProvider } from '@/i18n';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LanguageProvider>
  );
}
