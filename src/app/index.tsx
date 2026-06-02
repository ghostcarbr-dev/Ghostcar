import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/i18n';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <StatusBar style="light" />
      <Image
        contentFit="cover"
        contentPosition={{ left: '43%', top: '50%' }}
        source={require('@/assets/images/ghostcar-hero-v2.png')}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>Ghostcar</Text>
            <Text style={styles.tagline}>{t('rentCars')}</Text>
          </View>

          {!authMode && (
            <View style={styles.welcomeActions}>
              <Pressable
                onPress={() => setAuthMode('signup')}
                style={({ pressed }) => [styles.openAccountButton, pressed && styles.pressed]}>
                <Text style={styles.openAccountText}>{t('openAccount')}</Text>
              </Pressable>

              <Pressable
                onPress={() => setAuthMode('login')}
                style={({ pressed }) => [styles.existingAccountButton, pressed && styles.pressed]}>
                <Text style={styles.existingAccountText}>{t('haveAccount')}</Text>
              </Pressable>
            </View>
          )}

          {authMode === 'signup' && (
            <View style={styles.signupCard}>
              <View style={styles.signupHeader}>
                <View style={styles.profileIcon}>
                  <Ionicons color="#079B65" name="person-outline" size={30} />
                </View>
                <Pressable
                  accessibilityLabel="Fechar"
                  onPress={() => setAuthMode(null)}
                  style={styles.closeButton}>
                  <Ionicons color="#737373" name="close" size={30} />
                </Pressable>
              </View>

              <Text style={styles.signupTitle}>{t('enterOrCreate')}</Text>
              <Text style={styles.signupSubtitle}>{t('signupInfo')}</Text>

              <Text style={styles.signupLabel}>{t('email')}</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder={t('typeEmail')}
                placeholderTextColor="#7B7B7B"
                style={styles.signupInput}
              />

              <Pressable
                style={({ pressed }) => [styles.emailContinueButton, pressed && styles.pressed]}>
                <Text style={styles.emailContinueText}>{t('continueEmail')}</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('or')}</Text>
                <View style={styles.divider} />
              </View>

              <Pressable style={({ pressed }) => [styles.googleButton, styles.signupSocialButton, pressed && styles.pressed]}>
                <Image
                  contentFit="contain"
                  source={require('@/assets/images/google-g-logo.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.socialButtonText}>{t('continueGoogle')}</Text>
              </Pressable>

              <Pressable style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}>
                <Ionicons color="#FFFFFF" name="logo-apple" size={26} />
                <Text style={styles.appleButtonText}>{t('continueApple')}</Text>
              </Pressable>
            </View>
          )}

          {authMode === 'login' && (
            <View style={styles.card}>
              <Pressable
                accessibilityLabel="Voltar"
                onPress={() => setAuthMode(null)}
                style={styles.cardBackButton}>
                <Text style={styles.cardBackIcon}>‹</Text>
              </Pressable>

              <Text style={styles.title}>{t('hello')}</Text>
              <Text style={styles.subtitle}>{t('accountInfo')}</Text>

              <Pressable style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
                <Image
                  contentFit="contain"
                  source={require('@/assets/images/google-g-logo.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.socialButtonText}>{t('continueGoogle')}</Text>
              </Pressable>

              <Pressable style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}>
                <Ionicons color="#FFFFFF" name="logo-apple" size={26} />
                <Text style={styles.appleButtonText}>{t('continueApple')}</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('or')}</Text>
                <View style={styles.divider} />
              </View>

              <Text style={styles.label}>{t('email')}</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder={t('typeEmail')}
                placeholderTextColor="#9B9B9B"
                style={styles.input}
              />

              <Text style={styles.label}>{t('password')}</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  placeholder={t('typePassword')}
                  placeholderTextColor="#9B9B9B"
                  secureTextEntry={!showPassword}
                  style={styles.passwordTextInput}
                />
                <Pressable
                  accessibilityLabel={
                    showPassword ? 'Ocultar senha' : 'Mostrar senha'
                  }
                  onPress={() => setShowPassword((visible) => !visible)}
                  style={styles.eyeButton}>
                  <Text style={styles.eyeIcon}>{showPassword ? '◉' : '◌'}</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push('/client-home')}
                style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
                <Text style={styles.loginButtonText}>{t('enter')}</Text>
              </Pressable>

              <Pressable style={styles.forgotButton}>
                <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
              </Pressable>

              <Pressable style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
                <Text style={styles.createButtonText}>{t('createAccount')}</Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#00102D',
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: 22,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 44,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3.2,
  },
  welcomeActions: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 14,
  },
  openAccountButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFCC2D',
  },
  openAccountText: {
    color: '#171717',
    fontSize: 17,
    fontWeight: '500',
  },
  existingAccountButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  existingAccountText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
  signupCard: {
    width: '94%',
    maxWidth: 660,
    alignSelf: 'center',
    marginTop: 18,
    marginBottom: 24,
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 34,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  signupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  profileIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ECFFF5',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7E7E7',
  },
  signupTitle: {
    color: '#111111',
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  signupSubtitle: {
    marginTop: 18,
    marginBottom: 30,
    color: '#666666',
    fontSize: 17,
    lineHeight: 24,
  },
  signupLabel: {
    marginBottom: 9,
    color: '#555555',
    fontSize: 17,
  },
  signupInput: {
    height: 64,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#C8CECC',
    borderRadius: 11,
    color: '#202020',
    fontSize: 18,
  },
  emailContinueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginTop: 26,
    borderRadius: 10,
    backgroundColor: '#C8E7DA',
  },
  emailContinueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    width: '92%',
    maxWidth: 660,
    alignSelf: 'center',
    marginTop: 28,
    marginBottom: 28,
    paddingHorizontal: 30,
    paddingTop: 22,
    paddingBottom: 38,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    marginBottom: 8,
    borderRadius: 19,
    backgroundColor: '#F0F0F0',
  },
  cardBackIcon: {
    marginTop: -5,
    color: '#333333',
    fontSize: 43,
    fontWeight: '200',
    lineHeight: 43,
  },
  title: {
    color: '#111111',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 2,
    color: '#656565',
    fontSize: 18,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    marginTop: 36,
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  signupSocialButton: {
    marginTop: 0,
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  socialButtonText: {
    color: '#252525',
    fontSize: 18,
    fontWeight: '600',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    marginTop: 14,
    borderRadius: 4,
    backgroundColor: '#111111',
    gap: 14,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginVertical: 34,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D6D6D6',
  },
  dividerText: {
    color: '#989898',
    fontSize: 18,
  },
  label: {
    marginBottom: 8,
    color: '#3B3B3B',
    fontSize: 17,
  },
  input: {
    height: 62,
    marginBottom: 25,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#C8C8C8',
    borderRadius: 11,
    color: '#202020',
    fontSize: 18,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#C8C8C8',
    borderRadius: 11,
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 18,
    color: '#202020',
    fontSize: 18,
  },
  eyeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: '100%',
  },
  eyeIcon: {
    color: '#737373',
    fontSize: 34,
    lineHeight: 38,
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    borderRadius: 7,
    backgroundColor: '#08735D',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  forgotButton: {
    alignSelf: 'flex-start',
    marginVertical: 24,
  },
  forgotText: {
    color: '#08735D',
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    borderWidth: 1.5,
    borderColor: '#08735D',
    borderRadius: 7,
  },
  createButtonText: {
    color: '#08735D',
    fontSize: 20,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.76,
  },
});
