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
  if (Platform.OS === 'web') {
    return <WebHomeScreen />;
  }

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

function WebHomeScreen() {
  const router = useRouter();
  const [destination, setDestination] = useState('');

  return (
    <View style={styles.webPage}>
      <StatusBar style="dark" />
      <View style={styles.webHeader}>
        <View>
          <Text style={styles.webLogo}>Ghostcar</Text>
          <Text style={styles.webLogoTagline}>ALUGUEL DE CARROS</Text>
        </View>
        <View style={styles.webNav}>
          <Text style={styles.webNavLink}>Aluguel de carros</Text>
          <Text style={styles.webNavLink}>Publicar meu carro</Text>
          <Text style={styles.webNavLink}>Ajuda</Text>
          <Pressable onPress={() => router.push('/client-home')} style={styles.webLoginButton}>
            <Ionicons color="#00102D" name="person-outline" size={18} />
            <Text style={styles.webLoginText}>Entrar</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.webHero}>
        <View style={styles.webSection}>
          <Text style={styles.webHeroTitle}>Aluguel de carros simples, rápido e seguro.</Text>
          <Text style={styles.webHeroSubtitle}>
            Encontre carros publicados perto de você e aproveite cada trajeto com liberdade.
          </Text>
          <View style={styles.webSearchCard}>
            <Text style={styles.webSearchLabel}>Onde você deseja retirar o carro?</Text>
            <View style={styles.webSearchRow}>
              <View style={styles.webDestinationInput}>
                <Ionicons color="#00102D" name="location-outline" size={22} />
                <TextInput
                  onChangeText={setDestination}
                  placeholder="Digite uma cidade, aeroporto ou endereço"
                  placeholderTextColor="#8C9693"
                  style={styles.webDestinationText}
                  value={destination}
                />
              </View>
              <Pressable onPress={() => router.push('/client-home')} style={styles.webSearchButton}>
                <Ionicons color="#FFFFFF" name="search" size={19} />
                <Text style={styles.webSearchButtonText}>Pesquisar</Text>
              </Pressable>
            </View>
            <Text style={styles.webSearchHint}>Consulte veículos disponíveis em até 50 km da localização escolhida.</Text>
          </View>
        </View>
      </View>

      <View style={[styles.webSection, styles.webBenefits]}>
        <WebBenefit icon="pricetag-outline" title="Preços transparentes" text="Compare anúncios próximos e escolha a opção ideal para sua viagem." />
        <WebBenefit icon="location-outline" title="Carros perto de você" text="Pesquise por endereço e encontre veículos disponíveis na região." />
        <WebBenefit icon="shield-checkmark-outline" title="Experiência simples" text="Uma plataforma direta para publicar, pesquisar e reservar seu carro." />
      </View>

      <View style={styles.webSoftSection}>
        <View style={styles.webSection}>
          <Text style={styles.webEyebrow}>DESCUBRA A GHOSTCAR</Text>
          <Text style={styles.webSectionTitle}>Seu próximo carro está mais perto do que você imagina</Text>
          <Text style={styles.webSectionSubtitle}>
            Escolha uma localização, encontre anúncios publicados por proprietários e prepare sua próxima viagem.
          </Text>
          <View style={styles.webFeatureGrid}>
            <WebFeature icon="search-outline" title="Pesquise sua região" text="Use sua localização ou digite o destino desejado." />
            <WebFeature icon="car-sport-outline" title="Compare veículos" text="Veja categoria, preço diário e distância de cada anúncio." />
            <WebFeature icon="key-outline" title="Viaje com liberdade" text="Encontre a opção certa para cada momento." />
          </View>
        </View>
      </View>

      <View style={[styles.webSection, styles.webPublishSection]}>
        <View style={styles.webPublishCopy}>
          <Text style={styles.webEyebrow}>PARA PROPRIETÁRIOS</Text>
          <Text style={styles.webSectionTitle}>Seu carro parado pode gerar novas oportunidades</Text>
          <Text style={styles.webSectionSubtitle}>
            Publique seu veículo na Ghostcar e permita que clientes próximos encontrem seu anúncio.
          </Text>
          <Pressable onPress={() => router.push('/client-home')} style={styles.webOutlineButton}>
            <Text style={styles.webOutlineButtonText}>Publicar meu carro</Text>
          </Pressable>
        </View>
        <View style={styles.webPublishVisual}>
          <Ionicons color="#FFFFFF" name="car-sport" size={94} />
          <Text style={styles.webPublishVisualText}>Publique. Conecte. Viaje.</Text>
        </View>
      </View>

      <View style={styles.webFooter}>
        <View style={[styles.webSection, styles.webFooterGrid]}>
          <View>
            <Text style={styles.webFooterLogo}>Ghostcar</Text>
            <Text style={styles.webFooterText}>Aluguel de carros de um jeito mais próximo.</Text>
          </View>
          <View>
            <Text style={styles.webFooterTitle}>Ghostcar</Text>
            <Text style={styles.webFooterText}>Página inicial</Text>
            <Text style={styles.webFooterText}>Publicar meu carro</Text>
            <Text style={styles.webFooterText}>Promoções</Text>
          </View>
          <View>
            <Text style={styles.webFooterTitle}>Suporte</Text>
            <Text style={styles.webFooterText}>Central de ajuda</Text>
            <Text style={styles.webFooterText}>Política de privacidade</Text>
            <Text style={styles.webFooterText}>Termos e condições</Text>
          </View>
        </View>
        <Text style={styles.webCopyright}>© 2026 Ghostcar. Todos os direitos reservados.</Text>
      </View>
    </View>
  );
}

function WebBenefit({ icon, text, title }: { icon: keyof typeof Ionicons.glyphMap; text: string; title: string }) {
  return (
    <View style={styles.webBenefit}>
      <View style={styles.webIconCircle}>
        <Ionicons color="#00102D" name={icon} size={25} />
      </View>
      <View style={styles.webBenefitCopy}>
        <Text style={styles.webBenefitTitle}>{title}</Text>
        <Text style={styles.webBenefitText}>{text}</Text>
      </View>
    </View>
  );
}

function WebFeature({ icon, text, title }: { icon: keyof typeof Ionicons.glyphMap; text: string; title: string }) {
  return (
    <View style={styles.webFeature}>
      <Ionicons color="#00102D" name={icon} size={31} />
      <Text style={styles.webFeatureTitle}>{title}</Text>
      <Text style={styles.webFeatureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#00102D',
    ...Platform.select({
      web: {
        backgroundColor: '#FFFFFF',
      },
    }),
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
    ...Platform.select({
      web: {
        marginTop: 28,
      },
    }),
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 44,
    ...Platform.select({
      web: {
        color: '#00102D',
        fontSize: 28,
        lineHeight: 35,
      },
    }),
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3.2,
    ...Platform.select({
      web: {
        color: '#656565',
        fontSize: 7,
      },
    }),
  },
  welcomeActions: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 14,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center',
        paddingBottom: 30,
      },
    }),
  },
  openAccountButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFCC2D',
    ...Platform.select({
      web: {
        height: 48,
        borderRadius: 12,
      },
    }),
  },
  openAccountText: {
    color: '#171717',
    fontSize: 15,
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
    ...Platform.select({
      web: {
        height: 48,
        borderColor: '#00102D',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
      },
    }),
  },
  existingAccountText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    ...Platform.select({
      web: {
        color: '#00102D',
      },
    }),
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
    ...Platform.select({
      web: {
        maxWidth: 440,
        marginTop: 16,
        paddingHorizontal: 22,
        paddingTop: 18,
        paddingBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 16,
      },
    }),
  },
  signupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    ...Platform.select({
      web: {
        marginBottom: 18,
      },
    }),
  },
  profileIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ECFFF5',
    ...Platform.select({
      web: {
        width: 48,
        height: 48,
        borderRadius: 24,
      },
    }),
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7E7E7',
    ...Platform.select({
      web: {
        width: 40,
        height: 40,
        borderRadius: 20,
      },
    }),
  },
  signupTitle: {
    color: '#111111',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
    ...Platform.select({
      web: {
        fontSize: 21,
      },
    }),
  },
  signupSubtitle: {
    marginTop: 18,
    marginBottom: 30,
    color: '#666666',
    fontSize: 15,
    lineHeight: 24,
    ...Platform.select({
      web: {
        marginTop: 10,
        marginBottom: 18,
        fontSize: 13,
        lineHeight: 19,
      },
    }),
  },
  signupLabel: {
    marginBottom: 9,
    color: '#555555',
    fontSize: 15,
  },
  signupInput: {
    height: 64,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#C8CECC',
    borderRadius: 11,
    color: '#202020',
    fontSize: 16,
    ...Platform.select({
      web: {
        height: 52,
        fontSize: 14,
      },
    }),
  },
  emailContinueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginTop: 26,
    borderRadius: 10,
    backgroundColor: '#C8E7DA',
    ...Platform.select({
      web: {
        height: 50,
        marginTop: 18,
      },
    }),
  },
  emailContinueText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    ...Platform.select({
      web: {
        maxWidth: 440,
        marginTop: 16,
        marginBottom: 22,
        paddingHorizontal: 22,
        paddingTop: 16,
        paddingBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 16,
        shadowOpacity: 0.05,
      },
    }),
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
    ...Platform.select({
      web: {
        fontSize: 36,
      },
    }),
  },
  title: {
    color: '#111111',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
    ...Platform.select({
      web: {
        fontSize: 24,
      },
    }),
  },
  subtitle: {
    marginTop: 2,
    color: '#656565',
    fontSize: 16,
    ...Platform.select({
      web: {
        fontSize: 14,
      },
    }),
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
    ...Platform.select({
      web: {
        height: 52,
        marginTop: 24,
      },
    }),
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
    fontSize: 16,
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
    ...Platform.select({
      web: {
        height: 52,
        marginTop: 10,
      },
    }),
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginVertical: 34,
    ...Platform.select({
      web: {
        marginVertical: 22,
      },
    }),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D6D6D6',
  },
  dividerText: {
    color: '#989898',
    fontSize: 16,
    ...Platform.select({
      web: {
        fontSize: 14,
      },
    }),
  },
  label: {
    marginBottom: 8,
    color: '#3B3B3B',
    fontSize: 15,
  },
  input: {
    height: 62,
    marginBottom: 25,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#C8C8C8',
    borderRadius: 11,
    color: '#202020',
    fontSize: 16,
    ...Platform.select({
      web: {
        height: 52,
        marginBottom: 18,
        fontSize: 14,
      },
    }),
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#C8C8C8',
    borderRadius: 11,
    ...Platform.select({
      web: {
        height: 52,
        marginBottom: 20,
      },
    }),
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 18,
    color: '#202020',
    fontSize: 16,
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
    backgroundColor: '#00102D',
    ...Platform.select({
      web: {
        height: 52,
      },
    }),
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  forgotButton: {
    alignSelf: 'flex-start',
    marginVertical: 24,
    ...Platform.select({
      web: {
        marginVertical: 16,
      },
    }),
  },
  forgotText: {
    color: '#00102D',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    borderWidth: 1.5,
    borderColor: '#00102D',
    borderRadius: 7,
    ...Platform.select({
      web: {
        height: 52,
      },
    }),
  },
  createButtonText: {
    color: '#00102D',
    fontSize: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.76,
  },
  webPage: {
    backgroundColor: '#FFFFFF',
    minHeight: '100%',
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 26,
    paddingVertical: 18,
  },
  webLogo: {
    color: '#00102D',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -2,
  },
  webLogoTagline: {
    color: '#6C7875',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  webNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  webNavLink: {
    color: '#33413E',
    fontSize: 14,
    fontWeight: '600',
  },
  webLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#C7D9D4',
    borderRadius: 8,
  },
  webLoginText: {
    color: '#00102D',
    fontSize: 14,
    fontWeight: '700',
  },
  webHero: {
    backgroundColor: '#00102D',
    paddingVertical: 58,
  },
  webSection: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 26,
  },
  webHeroTitle: {
    maxWidth: 710,
    color: '#FFFFFF',
    fontSize: 39,
    fontWeight: '900',
    letterSpacing: -1.4,
    lineHeight: 48,
  },
  webHeroSubtitle: {
    maxWidth: 660,
    marginTop: 10,
    color: '#D7F1EA',
    fontSize: 17,
    lineHeight: 25,
  },
  webSearchCard: {
    marginTop: 34,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  webSearchLabel: {
    marginBottom: 10,
    color: '#283532',
    fontSize: 15,
    fontWeight: '800',
  },
  webSearchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  webDestinationInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 54,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#C8D5D1',
    borderRadius: 8,
  },
  webDestinationText: {
    flex: 1,
    height: '100%',
    color: '#263532',
    fontSize: 14,
  },
  webSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 166,
    borderRadius: 8,
    backgroundColor: '#FFB21C',
  },
  webSearchButtonText: {
    color: '#1C2926',
    fontSize: 15,
    fontWeight: '900',
  },
  webSearchHint: {
    marginTop: 10,
    color: '#75817F',
    fontSize: 12,
  },
  webBenefits: {
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 42,
  },
  webBenefit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  webIconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F7F2',
  },
  webBenefitCopy: {
    flex: 1,
  },
  webBenefitTitle: {
    color: '#23312E',
    fontSize: 15,
    fontWeight: '800',
  },
  webBenefitText: {
    marginTop: 4,
    color: '#6E7C79',
    fontSize: 12,
    lineHeight: 17,
  },
  webSoftSection: {
    paddingVertical: 68,
    backgroundColor: '#F4FAF8',
  },
  webEyebrow: {
    color: '#00102D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  webSectionTitle: {
    maxWidth: 680,
    marginTop: 9,
    color: '#24312E',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  webSectionSubtitle: {
    maxWidth: 680,
    marginTop: 10,
    color: '#687572',
    fontSize: 15,
    lineHeight: 23,
  },
  webFeatureGrid: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 32,
  },
  webFeature: {
    flex: 1,
    minHeight: 168,
    padding: 22,
    borderWidth: 1,
    borderColor: '#DEEBE7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  webFeatureTitle: {
    marginTop: 16,
    color: '#25332F',
    fontSize: 16,
    fontWeight: '800',
  },
  webFeatureText: {
    marginTop: 7,
    color: '#71807C',
    fontSize: 13,
    lineHeight: 19,
  },
  webPublishSection: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 28,
    paddingVertical: 68,
  },
  webPublishCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  webOutlineButton: {
    alignSelf: 'flex-start',
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#00102D',
    borderRadius: 8,
  },
  webOutlineButtonText: {
    color: '#00102D',
    fontSize: 14,
    fontWeight: '800',
  },
  webPublishVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '38%',
    minHeight: 240,
    borderRadius: 18,
    backgroundColor: '#00102D',
  },
  webPublishVisualText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  webFooter: {
    paddingTop: 42,
    paddingBottom: 18,
    backgroundColor: '#102D27',
  },
  webFooterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 50,
    paddingBottom: 30,
  },
  webFooterLogo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  webFooterTitle: {
    marginBottom: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  webFooterText: {
    maxWidth: 300,
    marginTop: 7,
    color: '#B9D0CA',
    fontSize: 12,
  },
  webCopyright: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2B4942',
    color: '#9DB5AF',
    fontSize: 11,
    textAlign: 'center',
  },
});
