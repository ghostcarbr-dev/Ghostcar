import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DimensionValue,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostcarLogo } from '@/components/GhostcarLogo';
import { useLanguage } from '@/i18n';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type CarListing = {
  category: string;
  city: string | null;
  currency: string;
  dailyPrice: number;
  distanceKm: number | null;
  id: number;
  imageUrl: string | null;
  ownerName: string;
  title: string;
};

type AuthUser = {
  email: string;
  id: number;
  name: string | null;
  pictureUrl: string | null;
  provider: string;
};

type PlaceSuggestion = {
  coordinates: Coordinates;
  id: string;
  label: string;
};

type PublishStep = 'intro' | 'plate' | 'mileage' | 'features' | 'technical' | 'photos';

type WebPublishFormState = {
  brand: string;
  category: string;
  city: string;
  color: string;
  dailyPrice: string;
  doors: string;
  enginePower: string;
  features: string[];
  fuel: string;
  mileage: string;
  model: string;
  ownerName: string;
  photos: string[];
  plate: string;
  steering: string;
  title: string;
};

type PhotonFeature = {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    city?: string;
    country?: string;
    district?: string;
    name?: string;
    postcode?: string;
    state?: string;
    street?: string;
  };
};

const apiUrl = 'https://ghostcar-api.onrender.com';
const brazilCarBrands = [
  'Chevrolet',
  'Fiat',
  'Volkswagen',
  'Hyundai',
  'Toyota',
  'Jeep',
  'Renault',
  'Honda',
  'Nissan',
  'Ford',
  'Peugeot',
  'Citroën',
  'Mitsubishi',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volvo',
  'BYD',
  'Caoa Chery',
  'GWM',
];
const brazilCarModelsByBrand: Record<string, string[]> = {
  Chevrolet: ['Onix', 'Onix Plus', 'Tracker', 'Spin', 'S10', 'Montana', 'Cruze'],
  Fiat: ['Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Strada', 'Toro'],
  Volkswagen: ['Gol', 'Polo', 'Virtus', 'Nivus', 'T-Cross', 'Taos', 'Saveiro'],
  Hyundai: ['HB20', 'HB20S', 'Creta', 'Tucson', 'Santa Fe', 'Azera'],
  Toyota: ['Corolla', 'Corolla Cross', 'Hilux', 'SW4', 'Yaris', 'Etios', 'RAV4'],
  Jeep: ['Renegade', 'Compass', 'Commander', 'Wrangler'],
  Renault: ['Kwid', 'Sandero', 'Logan', 'Duster', 'Oroch', 'Captur'],
  Honda: ['Fit', 'City', 'Civic', 'HR-V', 'WR-V', 'CR-V'],
  Nissan: ['Kicks', 'Versa', 'Sentra', 'Frontier', 'March'],
  Ford: ['Ka', 'Ka Sedan', 'EcoSport', 'Ranger', 'Territory', 'Fiesta'],
  Peugeot: ['208', '2008', '3008', 'Partner', 'Expert'],
  Citroën: ['C3', 'C3 Aircross', 'C4 Cactus', 'Jumpy', 'Berlingo'],
  Mitsubishi: ['L200', 'Pajero', 'Outlander', 'ASX', 'Eclipse Cross'],
  BMW: ['Série 1', 'Série 3', 'X1', 'X3', 'X5', '320i'],
  'Mercedes-Benz': ['Classe A', 'Classe C', 'GLA', 'GLC', 'Sprinter'],
  Audi: ['A3', 'A4', 'Q3', 'Q5', 'Q7'],
  Volvo: ['XC40', 'XC60', 'XC90', 'S60'],
  BYD: ['Dolphin', 'Dolphin Mini', 'Song Plus', 'Yuan Plus', 'Seal'],
  'Caoa Chery': ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6'],
  GWM: ['Haval H6', 'Ora 03', 'Tank 300', 'Poer'],
};
const publishStepOrder: PublishStep[] = ['intro', 'plate', 'mileage', 'features', 'technical', 'photos'];
const webInactivityLimitMs = 10 * 60 * 1000;
const webLastActivityStorageKey = 'ghostcar_last_activity';
const webSessionStorageKey = 'ghostcar_session_token';

function getWebSessionToken() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return window.sessionStorage.getItem(webSessionStorageKey);
}

function storeWebSessionToken(token: string) {
  if (Platform.OS === 'web') {
    window.sessionStorage.setItem(webSessionStorageKey, token);
    updateWebLastActivity();
  }
}

function clearWebSessionToken() {
  if (Platform.OS === 'web') {
    window.sessionStorage.removeItem(webSessionStorageKey);
    window.sessionStorage.removeItem(webLastActivityStorageKey);
  }
}

function updateWebLastActivity() {
  if (Platform.OS === 'web') {
    window.sessionStorage.setItem(webLastActivityStorageKey, String(Date.now()));
  }
}

function isWebSessionInactive() {
  if (Platform.OS !== 'web') {
    return false;
  }

  const lastActivity = Number(window.sessionStorage.getItem(webLastActivityStorageKey));
  if (!Number.isFinite(lastActivity) || lastActivity <= 0) {
    updateWebLastActivity();
    return false;
  }

  return Date.now() - lastActivity > webInactivityLimitMs;
}

async function openGoogleSignIn(mode: 'login' | 'signup' = 'login') {
  const returnTo = Platform.OS === 'web' ? window.location.origin : 'https://ghostcar.com.br';
  const googleSignInUrl = `${apiUrl}/auth/google?mode=${mode}&returnTo=${encodeURIComponent(returnTo)}`;

  if (Platform.OS === 'web') {
    window.location.href = googleSignInUrl;
    return;
  }

  await WebBrowser.openBrowserAsync(googleSignInUrl);
}

function useStableWebWidth() {
  const dimensions = useWindowDimensions();
  const [webWidth, setWebWidth] = useState(() => {
    if (Platform.OS === 'web') {
      return window.innerWidth;
    }

    return dimensions.width;
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setWebWidth(dimensions.width);
      return undefined;
    }

    function updateWebWidth() {
      setWebWidth(window.innerWidth);
    }

    updateWebWidth();
    window.addEventListener('resize', updateWebWidth);

    return () => window.removeEventListener('resize', updateWebWidth);
  }, [dimensions.width]);

  return Platform.OS === 'web' ? webWidth : dimensions.width;
}

export default function HomeScreen() {
  if (Platform.OS === 'web') {
    return <WebHomeScreen />;
  }

  const router = useRouter();
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [signupStep, setSignupStep] = useState<'email' | 'details'>('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [nativeSignupForm, setNativeSignupForm] = useState({
    birthDate: '',
    cpf: '',
    firstName: '',
    lastName: '',
    password: '',
    phone: '',
  });
  const [acceptEmailCommunication, setAcceptEmailCommunication] = useState(false);
  const [nativeSignupError, setNativeSignupError] = useState('');
  const [isCreatingNativeAccount, setIsCreatingNativeAccount] = useState(false);
  const [nativeLoginEmail, setNativeLoginEmail] = useState('');
  const [nativeLoginPassword, setNativeLoginPassword] = useState('');
  const [nativeLoginError, setNativeLoginError] = useState('');
  const [isNativeLoginLoading, setIsNativeLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const normalizedSignupEmail = signupEmail.trim().toLowerCase();
  const isSignupEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedSignupEmail);

  function updateNativeSignupField(field: keyof typeof nativeSignupForm, value: string) {
    setNativeSignupForm((currentForm) => ({ ...currentForm, [field]: value }));
    setNativeSignupError('');
  }

  function resetNativeSignup() {
    setAuthMode(null);
    setSignupStep('email');
    setSignupEmail('');
    setNativeSignupForm({
      birthDate: '',
      cpf: '',
      firstName: '',
      lastName: '',
      password: '',
      phone: '',
    });
    setAcceptEmailCommunication(false);
    setNativeSignupError('');
  }

  async function createNativeAccount() {
    if (!isSignupEmailValid) {
      setNativeSignupError('Digite um e-mail válido.');
      setSignupStep('email');
      return;
    }

    if (
      !nativeSignupForm.firstName.trim()
      || !nativeSignupForm.lastName.trim()
      || !nativeSignupForm.birthDate.trim()
      || !nativeSignupForm.phone.trim()
      || !nativeSignupForm.cpf.trim()
      || !nativeSignupForm.password
    ) {
      setNativeSignupError('Preencha todos os campos.');
      return;
    }

    if (nativeSignupForm.password.length < 8) {
      setNativeSignupError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setIsCreatingNativeAccount(true);
    setNativeSignupError('');

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        body: JSON.stringify({
          birthDate: nativeSignupForm.birthDate,
          country: 'Brasil',
          cpf: nativeSignupForm.cpf,
          email: normalizedSignupEmail,
          firstName: nativeSignupForm.firstName,
          lastName: nativeSignupForm.lastName,
          password: nativeSignupForm.password,
          passwordConfirmation: nativeSignupForm.password,
          phone: nativeSignupForm.phone,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setNativeSignupError(response.status === 409 ? 'Este e-mail já está cadastrado.' : data.error || 'Não foi possível criar a conta.');
        return;
      }

      router.push('/client-home');
    } catch {
      setNativeSignupError('Não foi possível criar a conta. Tente novamente.');
    } finally {
      setIsCreatingNativeAccount(false);
    }
  }

  async function loginNativeAccount() {
    const email = nativeLoginEmail.trim().toLowerCase();

    if (!email || !nativeLoginPassword) {
      setNativeLoginError('Digite seu e-mail e senha.');
      return;
    }

    setIsNativeLoginLoading(true);
    setNativeLoginError('');

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        body: JSON.stringify({ email, password: nativeLoginPassword }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setNativeLoginError(response.status === 401 ? 'E-mail ou senha incorretos.' : data.error || 'Não foi possível entrar.');
        return;
      }

      router.push('/client-home');
    } catch {
      setNativeLoginError('Não foi possível entrar. Verifique sua conexão.');
    } finally {
      setIsNativeLoginLoading(false);
    }
  }

  function showUnavailableMessage(feature: string) {
    Alert.alert('Em breve', `${feature} ainda não está disponível no aplicativo.`);
  }

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
            <GhostcarLogo align="center" color="#FFFFFF" size="hero" />
          </View>

          {!authMode && (
            <View style={styles.welcomeActions}>
              <Pressable
                onPress={() => {
                  setSignupStep('email');
                  setAuthMode('signup');
                }}
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
                  onPress={resetNativeSignup}
                  style={styles.closeButton}>
                  <Ionicons color="#737373" name="close" size={30} />
                </Pressable>
              </View>

              {signupStep === 'email' ? (
                <>
                  <Text style={styles.signupTitle}>{t('enterOrCreate')}</Text>
                  <Text style={styles.signupSubtitle}>{t('signupInfo')}</Text>

                  <Text style={styles.signupLabel}>{t('email')}</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onChangeText={(value) => {
                      setSignupEmail(value);
                      setNativeSignupError('');
                    }}
                    placeholder={t('typeEmail')}
                    placeholderTextColor="#7B7B7B"
                    style={styles.signupInput}
                    value={signupEmail}
                  />

                  <Pressable
                    disabled={!isSignupEmailValid}
                    onPress={() => setSignupStep('details')}
                    style={({ pressed }) => [
                      styles.emailContinueButton,
                      !isSignupEmailValid && styles.emailContinueButtonDisabled,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.emailContinueText}>{t('continueEmail')}</Text>
                  </Pressable>

                  <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>{t('or')}</Text>
                    <View style={styles.divider} />
                  </View>

                  <Pressable
                    onPress={() => openGoogleSignIn('signup')}
                    style={({ pressed }) => [styles.googleButton, styles.signupSocialButton, pressed && styles.pressed]}>
                    <Image
                      contentFit="contain"
                      source={require('@/assets/images/google-g-logo.png')}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.socialButtonText}>{t('continueGoogle')}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => showUnavailableMessage('Continuar com Apple')}
                    style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}>
                    <Ionicons color="#FFFFFF" name="logo-apple" size={26} />
                    <Text style={styles.appleButtonText}>{t('continueApple')}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    accessibilityLabel="Voltar"
                    onPress={() => setSignupStep('email')}
                    style={styles.signupBackButton}>
                    <Ionicons color="#333333" name="arrow-back" size={28} />
                  </Pressable>
                  <Text style={styles.signupTitle}>Crie sua conta</Text>
                  <Text style={styles.signupDescription}>
                    Lembre-se que os dados devem corresponder às informações do condutor responsável pela retirada do veículo.
                  </Text>

                  <Text style={styles.signupLabel}>E-mail</Text>
                  <View style={styles.verifiedEmailBox}>
                    <Text style={styles.verifiedEmailText}>{normalizedSignupEmail}</Text>
                    <Ionicons color="#2CBF7A" name="checkmark-circle" size={28} />
                  </View>

                  <Text style={styles.signupLabel}>Nome</Text>
                  <TextInput
                    onChangeText={(value) => updateNativeSignupField('firstName', value)}
                    placeholder="Informe seu nome"
                    placeholderTextColor="#B8B8B8"
                    style={[styles.signupInput, styles.nativeSignupInput]}
                    value={nativeSignupForm.firstName}
                  />

                  <Text style={styles.signupLabel}>Sobrenome</Text>
                  <TextInput
                    onChangeText={(value) => updateNativeSignupField('lastName', value)}
                    placeholder="Informe seu sobrenome"
                    placeholderTextColor="#B8B8B8"
                    style={[styles.signupInput, styles.nativeSignupInput]}
                    value={nativeSignupForm.lastName}
                  />

                  <Text style={styles.signupLabel}>Data de nascimento</Text>
                  <TextInput
                    keyboardType="numbers-and-punctuation"
                    onChangeText={(value) => updateNativeSignupField('birthDate', value)}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#B8B8B8"
                    style={[styles.signupInput, styles.nativeSignupInput]}
                    value={nativeSignupForm.birthDate}
                  />

                  <Text style={styles.signupLabel}>Telefone</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.phonePrefix}>
                      <Text style={styles.phoneFlag}>🇧🇷</Text>
                      <Text style={styles.phonePrefixText}>+55</Text>
                      <Ionicons color="#111111" name="chevron-down" size={22} />
                    </View>
                    <TextInput
                      keyboardType="phone-pad"
                      onChangeText={(value) => updateNativeSignupField('phone', value)}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#B8B8B8"
                      style={styles.phoneNumberInput}
                      value={nativeSignupForm.phone}
                    />
                  </View>

                  <Text style={styles.signupLabel}>CPF</Text>
                  <TextInput
                    keyboardType="numbers-and-punctuation"
                    onChangeText={(value) => updateNativeSignupField('cpf', value)}
                    placeholder="000.000.000-00"
                    placeholderTextColor="#B8B8B8"
                    style={[styles.signupInput, styles.nativeSignupInput]}
                    value={nativeSignupForm.cpf}
                  />

                  <Text style={styles.signupLabel}>Senha</Text>
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={(value) => updateNativeSignupField('password', value)}
                    placeholder="Informe uma senha"
                    placeholderTextColor="#B8B8B8"
                    secureTextEntry
                    style={[styles.signupInput, styles.nativeSignupInput]}
                    value={nativeSignupForm.password}
                  />

                  <Pressable
                    onPress={() => setAcceptEmailCommunication((accepted) => !accepted)}
                    style={styles.nativeSignupCheckboxRow}>
                    <View style={[styles.nativeSignupCheckbox, acceptEmailCommunication && styles.nativeSignupCheckboxChecked]}>
                      {acceptEmailCommunication && <Ionicons color="#FFFFFF" name="checkmark" size={18} />}
                    </View>
                    <Text style={styles.nativeSignupCheckboxText}>Aceito receber comunicações por e-mail</Text>
                  </Pressable>

                  {!!nativeSignupError && <Text style={styles.nativeSignupErrorText}>{nativeSignupError}</Text>}

                  <Pressable
                    disabled={isCreatingNativeAccount}
                    onPress={createNativeAccount}
                    style={({ pressed }) => [
                      styles.emailContinueButton,
                      styles.nativeSignupSubmitButton,
                      isCreatingNativeAccount && styles.emailContinueButtonDisabled,
                      pressed && styles.pressed,
                    ]}>
                    {isCreatingNativeAccount ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.emailContinueText}>Continuar</Text>
                    )}
                  </Pressable>

                  <Text style={styles.nativeSignupTerms}>
                    Ao seguir utilizando nossas soluções você está ciente de que seus dados pessoais serão tratados conforme a{' '}
                    <Text style={styles.nativeSignupLink}>Política de Privacidade</Text> da Ghostcar.
                    {'\n\n'}Ao fazer login ou criar uma conta, você aceita os{' '}
                    <Text style={styles.nativeSignupLink}>Termos e Condições</Text>.
                  </Text>
                </>
              )}
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

              <Pressable
                onPress={() => openGoogleSignIn('login')}
                style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
                <Image
                  contentFit="contain"
                  source={require('@/assets/images/google-g-logo.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.socialButtonText}>{t('continueGoogle')}</Text>
              </Pressable>

              <Pressable
                onPress={() => showUnavailableMessage('Continuar com Apple')}
                style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}>
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
                value={nativeLoginEmail}
                onChangeText={(value) => {
                  setNativeLoginEmail(value);
                  setNativeLoginError('');
                }}
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
                  value={nativeLoginPassword}
                  onChangeText={(value) => {
                    setNativeLoginPassword(value);
                    setNativeLoginError('');
                  }}
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

              {!!nativeLoginError && <Text style={styles.nativeSignupErrorText}>{nativeLoginError}</Text>}

              <Pressable
                disabled={isNativeLoginLoading}
                onPress={loginNativeAccount}
                style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
                {isNativeLoginLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>{t('enter')}</Text>
                )}
              </Pressable>

              <Pressable onPress={() => showUnavailableMessage(t('forgotPassword'))} style={styles.forgotButton}>
                <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setSignupStep('email');
                  setAuthMode('signup');
                }}
                style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
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
  const width = useStableWebWidth();
  const [destination, setDestination] = useState('');
  const [cars, setCars] = useState<CarListing[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isPublishingCar, setIsPublishingCar] = useState(false);
  const [isPublishWizardOpen, setIsPublishWizardOpen] = useState(false);
  const [isWebSignupPageOpen, setIsWebSignupPageOpen] = useState(false);
  const [isWebLoginOpen, setIsWebLoginOpen] = useState(false);
  const [webLoginError, setWebLoginError] = useState('');
  const [publishFeedback, setPublishFeedback] = useState('');
  const [publishForm, setPublishForm] = useState<WebPublishFormState>({
    brand: '',
    category: '',
    city: '',
    color: 'Cinza',
    dailyPrice: '',
    doors: '',
    enginePower: '1.0',
    features: [] as string[],
    fuel: 'Flex',
    mileage: '',
    model: '',
    ownerName: '',
    photos: [] as string[],
    plate: '',
    steering: '',
    title: '',
  });
  const [publishStep, setPublishStep] = useState<PublishStep>('intro');
  const [searchError, setSearchError] = useState('');
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [webUser, setWebUser] = useState<AuthUser | null>(null);
  const skipNextSuggestionFetch = useRef(false);
  const isMobileWeb = width < 720;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    function syncSignupPageWithHash() {
      setIsWebSignupPageOpen(window.location.hash === '#cadastro');
    }

    syncSignupPageWithHash();
    window.addEventListener('hashchange', syncSignupPageWithHash);

    return () => window.removeEventListener('hashchange', syncSignupPageWithHash);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const url = new URL(window.location.href);
    const authStatus = url.searchParams.get('auth');
    const sessionCode = url.searchParams.get('sessionCode');

    if (authStatus === 'google-not-registered') {
      setWebLoginError('Este e-mail ainda não está cadastrado. Crie uma conta antes de continuar com Google.');
      setIsWebLoginOpen(true);
      url.searchParams.delete('auth');
    } else if (authStatus === 'google-error') {
      setWebLoginError('Não foi possível entrar com Google. Tente novamente.');
      setIsWebLoginOpen(true);
      url.searchParams.delete('auth');
    } else if (authStatus) {
      url.searchParams.delete('auth');
    }

    if (sessionCode) {
      url.searchParams.delete('sessionCode');
    }

    if (authStatus || sessionCode) {
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }

    async function exchangeGoogleSessionCode() {
      if (!sessionCode) {
        return null;
      }

      const response = await fetch(`${apiUrl}/auth/session/exchange`, {
        body: JSON.stringify({ code: sessionCode }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Session code exchange failed');
      }

      const data = (await response.json()) as { sessionToken?: string; user?: AuthUser };
      if (!data.sessionToken || !data.user) {
        throw new Error('Session code exchange returned invalid data');
      }

      storeWebSessionToken(data.sessionToken);
      return data.user;
    }

    async function loadCurrentUser() {
      try {
        const exchangedUser = await exchangeGoogleSessionCode();
        if (exchangedUser) {
          setWebUser(exchangedUser);
          updateWebLastActivity();
          return;
        }

        if (isWebSessionInactive()) {
          clearWebSessionToken();
          await fetch(`${apiUrl}/auth/logout`, {
            credentials: 'include',
            method: 'POST',
          });
          setWebUser(null);
          return;
        }

        const storedSessionToken = getWebSessionToken();
        if (!storedSessionToken) {
          setWebUser(null);
          return;
        }

        const response = await fetch(`${apiUrl}/auth/me`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${storedSessionToken}` },
        });
        if (!response.ok) {
          setWebUser(null);
          return;
        }

        const data = (await response.json()) as { user: AuthUser | null };
        setWebUser(data.user);
        if (data.user) {
          updateWebLastActivity();
        }
      } catch {
        setWebUser(null);
      }
    }

    loadCurrentUser();
  }, []);

  async function handleWebLogout() {
    try {
      const storedSessionToken = getWebSessionToken();
      await fetch(`${apiUrl}/auth/logout`, {
        credentials: 'include',
        headers: storedSessionToken ? { Authorization: `Bearer ${storedSessionToken}` } : undefined,
        method: 'POST',
      });
    } finally {
      clearWebSessionToken();
      setWebUser(null);
      setIsWebLoginOpen(false);
    }
  }

  useEffect(() => {
    if (Platform.OS !== 'web' || !webUser) {
      return undefined;
    }

    let inactivityTimeout: ReturnType<typeof setTimeout>;
    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

    function disconnectInactiveUser() {
      handleWebLogout();
    }

    function resetInactivityTimer() {
      updateWebLastActivity();
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(disconnectInactiveUser, webInactivityLimitMs);
    }

    resetInactivityTimer();
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer, { passive: true }));

    return () => {
      clearTimeout(inactivityTimeout);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer));
    };
  }, [webUser]);

  useEffect(() => {
    const query = destination.trim();

    if (skipNextSuggestionFetch.current) {
      skipNextSuggestionFetch.current = false;
      return;
    }

    setSelectedCoordinates(null);

    if (query.length < 3) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true);

      try {
        const params = new URLSearchParams({ limit: '6', q: query });
        const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Suggestion request failed');
        }

        const data = (await response.json()) as { features: PhotonFeature[] };
        setSuggestions(
          data.features.map((feature, index) => {
            const [longitude, latitude] = feature.geometry.coordinates;
            return {
              coordinates: { latitude, longitude },
              id: `${longitude}-${latitude}-${index}`,
              label: formatPhotonSuggestion(feature.properties),
            };
          }).filter((suggestion) => suggestion.label)
        );
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [destination]);

  function selectWebSuggestion(suggestion: PlaceSuggestion) {
    skipNextSuggestionFetch.current = true;
    setDestination(suggestion.label);
    setSelectedCoordinates(suggestion.coordinates);
    setSuggestions([]);
    setSearchError('');
  }

  function openWebSignupPage() {
    setIsWebLoginOpen(false);
    setIsWebSignupPageOpen(true);

    if (Platform.OS === 'web' && window.location.hash !== '#cadastro') {
      window.location.hash = 'cadastro';
    }
  }

  function closeWebSignupPage() {
    setIsWebSignupPageOpen(false);

    if (Platform.OS === 'web' && window.location.hash === '#cadastro') {
      history.back();
    }
  }

  function updatePublishForm(field: keyof typeof publishForm, value: string) {
    setPublishForm((currentForm) => {
      if (field === 'brand') {
        const brandModels = brazilCarModelsByBrand[value] || [];

        return {
          ...currentForm,
          brand: value,
          model: brandModels.includes(currentForm.model) ? currentForm.model : '',
        };
      }

      return { ...currentForm, [field]: value };
    });
    setPublishFeedback('');
  }

  function openPublishForm() {
    if (!webUser) {
      setWebLoginError('Entre na sua conta para publicar seu carro.');
      setIsWebLoginOpen(true);
      setIsPublishWizardOpen(false);
      return;
    }

    setIsPublishWizardOpen(true);
    setPublishStep('intro');
    setPublishFeedback('');
  }

  function closePublishWizard() {
    setIsPublishWizardOpen(false);
    setPublishStep('intro');
  }

  function goToNextPublishStep() {
    const currentIndex = publishStepOrder.indexOf(publishStep);
    const nextStep = publishStepOrder[currentIndex + 1];

    if (nextStep) {
      setPublishStep(nextStep);
    }
  }

  function goToPreviousPublishStep() {
    const currentIndex = publishStepOrder.indexOf(publishStep);
    const previousStep = publishStepOrder[currentIndex - 1];

    if (previousStep) {
      setPublishStep(previousStep);
    } else {
      closePublishWizard();
    }
  }

  function togglePublishFeature(feature: string) {
    setPublishForm((currentForm) => {
      const hasFeature = currentForm.features.includes(feature);
      return {
        ...currentForm,
        features: hasFeature
          ? currentForm.features.filter((currentFeature) => currentFeature !== feature)
          : [...currentForm.features, feature],
      };
    });
  }

  function addPublishPhoto() {
    setPublishForm((currentForm) => {
      if (currentForm.photos.length >= 4) {
        return currentForm;
      }

      return {
        ...currentForm,
        photos: [...currentForm.photos, `Foto ${currentForm.photos.length + 1}`],
      };
    });
  }

  async function publishWebCar() {
    const ownerName = webUser?.name || webUser?.email || publishForm.ownerName.trim();
    const title = `${publishForm.brand.trim()} ${publishForm.model.trim()}`.trim();
    const category = publishForm.brand.trim();
    const city = publishForm.city.trim();
    const dailyPrice = Number(publishForm.dailyPrice.replace(',', '.'));

    if (!webUser) {
      setWebLoginError('Entre na sua conta para publicar seu carro.');
      setIsWebLoginOpen(true);
      setIsPublishWizardOpen(false);
      return;
    }

    if (!publishForm.plate.trim() || !title || !category || !city || !Number.isFinite(dailyPrice) || dailyPrice <= 0) {
      setPublishFeedback('Preencha placa, marca, modelo, cidade e preço válido.');
      return;
    }

    if (publishForm.photos.length !== 4) {
      setPublishFeedback('Adicione exatamente 4 fotos para publicar.');
      return;
    }

    setIsPublishingCar(true);
    setPublishFeedback('');

    try {
      const photonParams = new URLSearchParams({ limit: '1', q: city });
      const photonResponse = await fetch(`https://photon.komoot.io/api/?${photonParams.toString()}`);
      if (!photonResponse.ok) {
        throw new Error('Location search failed');
      }

      const photonData = (await photonResponse.json()) as { features: PhotonFeature[] };
      const [firstPlace] = photonData.features;
      if (!firstPlace) {
        setPublishFeedback('Não encontramos essa localização. Digite uma cidade ou endereço válido.');
        return;
      }

      const [longitude, latitude] = firstPlace.geometry.coordinates;
      const response = await fetch(`${apiUrl}/cars`, {
        body: JSON.stringify({
          category,
          city,
          currency: 'BRL',
          dailyPrice,
          latitude,
          longitude,
          ownerName,
          title,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Car publish failed');
      }

      setPublishForm({
        brand: '',
        category: '',
        city: '',
        color: 'Cinza',
        dailyPrice: '',
        doors: '',
        enginePower: '1.0',
        features: [],
        fuel: 'Flex',
        mileage: '',
        model: '',
        ownerName: '',
        photos: [],
        plate: '',
        steering: '',
        title: '',
      });
      setPublishStep('intro');
      setIsPublishWizardOpen(false);
      setPublishFeedback('Carro publicado com sucesso.');
    } catch {
      setPublishFeedback('Não foi possível publicar o carro agora. Tente novamente.');
    } finally {
      setIsPublishingCar(false);
    }
  }

  async function searchWebCars() {
    const query = destination.trim();
    if (!query) {
      setSearchError('Digite uma cidade, aeroporto ou endereço.');
      return;
    }

    setHasSearched(true);
    setIsLoadingCars(true);
    setSearchError('');

    try {
      let coordinates = selectedCoordinates;

      if (!coordinates) {
        const photonParams = new URLSearchParams({ limit: '1', q: query });
        const photonResponse = await fetch(`https://photon.komoot.io/api/?${photonParams.toString()}`);
        if (!photonResponse.ok) {
          throw new Error('Location search failed');
        }

        const photonData = (await photonResponse.json()) as { features: PhotonFeature[] };
        const [firstPlace] = photonData.features;
        if (!firstPlace) {
          setCars([]);
          setSearchError('Nenhuma localização encontrada para essa busca.');
          return;
        }

        const [longitude, latitude] = firstPlace.geometry.coordinates;
        coordinates = { latitude, longitude };
        setSelectedCoordinates(coordinates);
      }

      const carParams = new URLSearchParams({
        lat: String(coordinates.latitude),
        lon: String(coordinates.longitude),
        radiusKm: '50',
      });
      const carsResponse = await fetch(`${apiUrl}/cars?${carParams.toString()}`);
      if (!carsResponse.ok) {
        throw new Error('Car search failed');
      }

      const data = (await carsResponse.json()) as { cars: CarListing[] };
      setCars(data.cars);
      setSuggestions([]);
    } catch {
      setCars([]);
      setSearchError('Não foi possível buscar os carros agora. Tente novamente.');
    } finally {
      setIsLoadingCars(false);
    }
  }

  if (isWebSignupPageOpen) {
    return <WebSignupPage onBack={closeWebSignupPage} onSignupComplete={setWebUser} />;
  }

  if (isPublishWizardOpen) {
    return (
      <WebPublishWizard
        feedback={publishFeedback}
        form={publishForm}
        isMobileWeb={isMobileWeb}
        isPublishing={isPublishingCar}
        onAddPhoto={addPublishPhoto}
        onBack={goToPreviousPublishStep}
        onClose={closePublishWizard}
        onNext={goToNextPublishStep}
        onPublish={publishWebCar}
        onToggleFeature={togglePublishFeature}
        onUpdate={updatePublishForm}
        step={publishStep}
      />
    );
  }

  return (
    <View style={styles.webPage}>
      <StatusBar style="dark" />
      <View style={[styles.webHero, isMobileWeb && styles.webHeroMobile]}>
        <Image
          contentFit="cover"
          contentPosition={{ left: '45%', top: '42%' }}
          source={require('@/assets/images/ghostcar-hero-v2.png')}
          style={styles.webHeroImage}
        />
        <View style={styles.webHeroShade} />
        <View style={[styles.webHeader, styles.webHeaderOnHero, isMobileWeb && styles.webHeaderMobile]}>
          <GhostcarLogo color="#FFFFFF" size={isMobileWeb ? 'small' : 'medium'} />
          <View style={[styles.webNav, isMobileWeb && styles.webNavMobile]}>
            <Text style={[styles.webNavLink, styles.webNavLinkOnHero]}>Aluguel de carros</Text>
            <Pressable onPress={openPublishForm}>
              <Text style={[styles.webNavLink, styles.webNavLinkOnHero]}>Publicar meu carro</Text>
            </Pressable>
            {!isMobileWeb && <Text style={[styles.webNavLink, styles.webNavLinkOnHero]}>Ajuda</Text>}
            <Pressable
              onPress={() => {
                setWebLoginError('');
                setIsWebLoginOpen((isOpen) => !isOpen);
              }}
              style={[styles.webLoginButton, styles.webLoginButtonOnHero, webUser && styles.webAccountButtonOnHero, isMobileWeb && styles.webLoginButtonMobile]}>
              {webUser ? (
                <View style={styles.webAccountAvatar}>
                  <Text style={styles.webAccountAvatarText}>{(webUser.name || webUser.email).charAt(0).toUpperCase()}</Text>
                </View>
              ) : (
                <Ionicons color="#FFFFFF" name="person-outline" size={18} />
              )}
              <Text style={[styles.webLoginText, styles.webLoginTextOnHero]}>
                {webUser ? 'Minha conta' : 'Entrar'}
              </Text>
            </Pressable>
          </View>
        </View>
        {isWebLoginOpen && (
          <View style={[styles.webLoginPanelWrap, webUser && styles.webAccountPanelWrap, isMobileWeb && styles.webLoginPanelWrapMobile]}>
            <View style={[webUser ? styles.webAccountPanel : styles.webLoginPanel, isMobileWeb && (webUser ? styles.webAccountPanelMobile : styles.webLoginPanelMobile)]}>
              <View style={styles.webLoginArrow} />
              {webUser ? (
                <>
                  <View style={styles.webAccountHeader}>
                    <Text style={styles.webAccountName}>{webUser.name || 'Minha conta'}</Text>
                    <Text style={styles.webAccountEmail}>{webUser.email}</Text>
                  </View>
                  <View style={styles.webAccountMenu}>
                    <WebAccountMenuItem icon="person-circle-outline" label="Minha conta" />
                    <WebAccountMenuItem icon="ticket-outline" label="Minhas reservas" />
                    <WebAccountMenuItem icon="car-outline" label="Meus Carros" />
                    <Pressable onPress={handleWebLogout} style={styles.webAccountMenuItem}>
                      <Ionicons color="#4B5260" name="log-out-outline" size={24} />
                      <Text style={styles.webAccountMenuText}>Sair</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.webSignupColumn, isMobileWeb && styles.webLoginColumnMobile]}>
                    <Text style={styles.webLoginPanelTitle}>Criar nova conta</Text>
                    <Pressable
                      onPress={openWebSignupPage}
                      style={styles.webSignupButton}>
                      <Text style={styles.webSignupButtonText}>Cadastre-se</Text>
                    </Pressable>
                    <View style={styles.webLoginBenefitRow}>
                      <Ionicons color="#00102D" name="checkmark" size={22} />
                      <Text style={styles.webLoginBenefitText}>Rápido e fácil reservar</Text>
                    </View>
                    <View style={styles.webLoginBenefitRow}>
                      <Ionicons color="#00102D" name="checkmark" size={22} />
                      <Text style={styles.webLoginBenefitText}>Descontos de até 30%</Text>
                    </View>
                    <View style={styles.webLoginBenefitRow}>
                      <Ionicons color="#00102D" name="checkmark" size={22} />
                      <Text style={styles.webLoginBenefitText}>Acesso a ofertas exclusivas</Text>
                    </View>
                    <View style={styles.webLoginBenefitRow}>
                      <Ionicons color="#00102D" name="checkmark" size={22} />
                      <Text style={styles.webLoginBenefitText}>Ganhe cashback</Text>
                    </View>
                  </View>

                  <View style={[styles.webLoginColumn, isMobileWeb && styles.webLoginColumnMobile]}>
                    <Text style={styles.webLoginPanelTitle}>Login</Text>
                    <Text style={styles.webLoginLabel}>E-mail</Text>
                    <TextInput
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.webLoginInput}
                    />
                    <Text style={styles.webLoginLabel}>Senha</Text>
                    <TextInput secureTextEntry style={styles.webLoginInput} />
                    <Pressable>
                      <Text style={styles.webForgotText}>Esqueci minha senha</Text>
                    </Pressable>
                    <Pressable style={styles.webLoginSubmitButton}>
                      <Text style={styles.webLoginSubmitText}>Entrar</Text>
                    </Pressable>
                    <View style={styles.webLoginDividerRow}>
                      <View style={styles.webLoginDivider} />
                      <Text style={styles.webLoginDividerText}>ou</Text>
                      <View style={styles.webLoginDivider} />
                    </View>
                    <View style={[styles.webSocialRow, isMobileWeb && styles.webSocialRowMobile]}>
                      <Pressable
                        onPress={() => {
                          setWebLoginError('');
                          openGoogleSignIn('login');
                        }}
                        style={[styles.webSocialButton, isMobileWeb && styles.webSocialButtonMobile]}>
                        <Image
                          contentFit="contain"
                          source={require('@/assets/images/google-g-logo.png')}
                          style={styles.webSocialIcon}
                        />
                      </Pressable>
                      <Pressable style={[styles.webSocialButton, isMobileWeb && styles.webSocialButtonMobile]}>
                        <Ionicons color="#00102D" name="logo-apple" size={27} />
                      </Pressable>
                    </View>
                    {webLoginError ? <Text style={styles.webLoginErrorText}>{webLoginError}</Text> : null}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        <View style={[styles.webSection, styles.webHeroContent, isMobileWeb && styles.webSectionMobile]}>
          <View style={styles.webHeroTabs}>
            <Text style={[styles.webHeroTab, styles.webHeroTabActive]}>Aluguel de carros</Text>
            <Text style={styles.webHeroTab}>Aluguel mensal</Text>
            <Text style={styles.webHeroTab}>Carro por assinatura</Text>
          </View>
          <Text style={[styles.webHeroTitle, isMobileWeb && styles.webHeroTitleMobile]}>
            Aluguel de carros fácil e do seu jeito.
          </Text>
          <Text style={[styles.webHeroSubtitle, isMobileWeb && styles.webHeroSubtitleMobile]}>
            Viva as melhores experiências de aluguel de carro com a Ghostcar.
          </Text>
          <View style={[styles.webSearchCard, isMobileWeb && styles.webSearchCardMobile]}>
            <Text style={styles.webSearchLabel}>Onde você deseja retirar o carro?</Text>
            <View style={[styles.webSearchRow, isMobileWeb && styles.webSearchRowMobile]}>
              <View style={styles.webDestinationInput}>
                <Ionicons color="#00102D" name="location-outline" size={22} />
                <TextInput
                  onChangeText={setDestination}
                  placeholder="Digite uma cidade, aeroporto ou endereço"
                  placeholderTextColor="#8C9693"
                  style={styles.webDestinationText}
                  value={destination}
                />
                {isLoadingSuggestions && <ActivityIndicator color="#00102D" size="small" />}
              </View>
              <Pressable
                onPress={searchWebCars}
                style={[styles.webSearchButton, isMobileWeb && styles.webSearchButtonMobile]}>
                {isLoadingCars ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons color="#FFFFFF" name="search" size={19} />
                    <Text style={styles.webSearchButtonText}>Pesquisar</Text>
                  </>
                )}
              </Pressable>
            </View>
            {suggestions.length > 0 && (
              <View style={styles.webSuggestions}>
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.id}
                    onPress={() => selectWebSuggestion(suggestion)}
                    style={({ pressed }) => [styles.webSuggestionItem, pressed && styles.pressed]}>
                    <Ionicons color="#00102D" name="location-outline" size={17} />
                    <Text numberOfLines={2} style={styles.webSuggestionText}>
                      {suggestion.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Text style={styles.webSearchHint}>Consulte veículos disponíveis em até 50 km da localização escolhida.</Text>
            {!!searchError && <Text style={styles.webSearchError}>{searchError}</Text>}
          </View>
        </View>
      </View>

      {hasSearched && (
        <View style={[styles.webSection, styles.webResultsSection, isMobileWeb && styles.webSectionMobile]}>
          <Text style={styles.webEyebrow}>CARROS DISPONÍVEIS</Text>
          <Text style={[styles.webSectionTitle, isMobileWeb && styles.webSectionTitleMobile]}>
            Resultados perto de {destination.trim()}
          </Text>
          {isLoadingCars ? (
            <ActivityIndicator color="#00102D" size="large" style={styles.webResultsStatus} />
          ) : cars.length === 0 ? (
            <Text style={styles.webResultsStatusText}>
              Nenhum carro publicado foi encontrado nessa localização.
            </Text>
          ) : (
            <View style={[styles.webCarsGrid, isMobileWeb && styles.webCarsGridMobile]}>
              {cars.map((car) => (
                <View key={car.id} style={styles.webCarCard}>
                  {car.imageUrl ? (
                    <Image contentFit="cover" source={{ uri: car.imageUrl }} style={styles.webCarImage} />
                  ) : (
                    <View style={styles.webCarImagePlaceholder}>
                      <Ionicons color="#00102D" name="car-sport-outline" size={52} />
                    </View>
                  )}
                  <View style={styles.webCarContent}>
                    <Text style={styles.webCarTitle}>{car.title}</Text>
                    <Text style={styles.webCarMeta}>{car.category}</Text>
                    <Text style={styles.webCarMeta}>
                      {car.city ? `${car.city} • ` : ''}{formatDistance(car.distanceKm)}
                    </Text>
                    <Text style={styles.webCarPrice}>
                      {formatPrice(car.dailyPrice, car.currency)} <Text style={styles.webCarPriceUnit}>/ dia</Text>
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={[styles.webSection, styles.webBenefits, isMobileWeb && styles.webBenefitsMobile]}>
        <WebBenefit icon="pricetag-outline" title="Preços transparentes" text="Compare anúncios próximos e escolha a opção ideal para sua viagem." />
        <WebBenefit icon="location-outline" title="Carros perto de você" text="Pesquise por endereço e encontre veículos disponíveis na região." />
        <WebBenefit icon="shield-checkmark-outline" title="Experiência simples" text="Uma plataforma direta para publicar, pesquisar e reservar seu carro." />
      </View>

      <View style={styles.webSoftSection}>
        <View style={[styles.webSection, isMobileWeb && styles.webSectionMobile]}>
          <Text style={styles.webEyebrow}>DESCUBRA A GHOSTCAR</Text>
          <Text style={[styles.webSectionTitle, isMobileWeb && styles.webSectionTitleMobile]}>
            Seu próximo carro está mais perto do que você imagina
          </Text>
          <Text style={styles.webSectionSubtitle}>
            Escolha uma localização, encontre anúncios publicados por proprietários e prepare sua próxima viagem.
          </Text>
          <View style={[styles.webFeatureGrid, isMobileWeb && styles.webFeatureGridMobile]}>
            <WebFeature icon="search-outline" title="Pesquise sua região" text="Use sua localização ou digite o destino desejado." />
            <WebFeature icon="car-sport-outline" title="Compare veículos" text="Veja categoria, preço diário e distância de cada anúncio." />
            <WebFeature icon="key-outline" title="Viaje com liberdade" text="Encontre a opção certa para cada momento." />
          </View>
        </View>
      </View>

      <View
        nativeID="web-publish-section"
        style={[styles.webSection, styles.webPublishSection, isMobileWeb && styles.webPublishSectionMobile]}>
        <View style={styles.webPublishCopy}>
          <Text style={styles.webEyebrow}>PARA PROPRIETÁRIOS</Text>
          <Text style={[styles.webSectionTitle, isMobileWeb && styles.webSectionTitleMobile]}>
            Seu carro parado pode gerar novas oportunidades
          </Text>
          <Text style={styles.webSectionSubtitle}>
            Publique seu veículo na Ghostcar e permita que clientes próximos encontrem seu anúncio.
          </Text>
          <Pressable onPress={openPublishForm} style={styles.webOutlineButton}>
            <Text style={styles.webOutlineButtonText}>Publicar meu carro</Text>
          </Pressable>
          {!!publishFeedback && <Text style={styles.webPublishFeedback}>{publishFeedback}</Text>}
        </View>
        <View style={[styles.webPublishVisual, isMobileWeb && styles.webPublishVisualMobile]}>
          <Ionicons color="#FFFFFF" name="car-sport" size={94} />
          <Text style={styles.webPublishVisualText}>Publique. Conecte. Viaje.</Text>
        </View>
      </View>

      <View style={styles.webFooter}>
        <View style={[styles.webSection, styles.webFooterGrid, isMobileWeb && styles.webFooterGridMobile]}>
          <View>
            <GhostcarLogo color="#FFFFFF" size="small" taglineColor="#B9D0CA" />
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

function WebAccountMenuItem({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <Pressable style={styles.webAccountMenuItem}>
      <Ionicons color="#4B5260" name={icon} size={24} />
      <Text style={styles.webAccountMenuText}>{label}</Text>
    </Pressable>
  );
}

function WebPublishWizard({
  feedback,
  form,
  isMobileWeb,
  isPublishing,
  onAddPhoto,
  onBack,
  onClose,
  onNext,
  onPublish,
  onToggleFeature,
  onUpdate,
  step,
}: {
  feedback: string;
  form: WebPublishFormState;
  isMobileWeb: boolean;
  isPublishing: boolean;
  onAddPhoto: () => void;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
  onPublish: () => void;
  onToggleFeature: (feature: string) => void;
  onUpdate: (field: keyof WebPublishFormState, value: string) => void;
  step: PublishStep;
}) {
  const currentStepIndex = publishStepOrder.indexOf(step);
  const progress = `${((currentStepIndex + 1) / publishStepOrder.length) * 100}%` as DimensionValue;
  const selectedBrandModels = brazilCarModelsByBrand[form.brand] || [];
  const featureGroups = [
    {
      title: 'Segurança e Proteção',
      items: ['Airbag', 'Alarme', 'Câmera de ré', 'Sensor de ré', 'Blindado'],
    },
    {
      title: 'Conforto e Conveniência',
      items: ['Ar Condicionado', 'Teto Solar', 'Bancos de Couro', 'Trava elétrica', 'Vidro elétrico'],
    },
    {
      title: 'Tecnologia e Conectividade',
      items: ['Conexão USB', 'Volante multifuncional', 'Interface Bluetooth', 'Som', 'Computador de bordo', 'Navegador GPS'],
    },
  ];

  function renderStep() {
    if (step === 'intro') {
      return (
        <View style={[styles.webPublishWizardIntro, isMobileWeb && styles.webPublishWizardIntroMobile]}>
          <View style={styles.webPublishWizardCarCircle}>
            <Ionicons color="#00102D" name="car-sport" size={86} />
          </View>
          <View style={styles.webPublishWizardIntroCopy}>
            <Text style={styles.webPublishStepLabel}>Etapa 1 de 6</Text>
            <Text style={styles.webPublishWizardTitle}>Primeiro, vamos inserir os dados do seu veículo.</Text>
            <Text style={styles.webPublishWizardSubtitle}>
              Vamos pedir placa, quilometragem, detalhes técnicos e 4 fotos para criar seu anúncio.
            </Text>
          </View>
        </View>
      );
    }

    if (step === 'plate') {
      return (
        <View style={styles.webPublishWizardCenter}>
          <Text style={styles.webPublishWizardTitle}>Vamos começar pela placa do veículo.</Text>
          <Text style={styles.webPublishWizardSubtitle}>Ela será usada apenas para validar informações e preencher alguns dados.</Text>
          <View style={styles.webPublishPlateBox}>
            <Text style={styles.webPublishPlateHeader}>PLACA DO VEÍCULO</Text>
            <TextInput
              autoCapitalize="characters"
              maxLength={8}
              onChangeText={(value) => onUpdate('plate', value.toUpperCase())}
              placeholder="ABC1D23"
              placeholderTextColor="#8C9693"
              style={styles.webPublishPlateInput}
              value={form.plate}
            />
          </View>
          <View style={[styles.webPublishFormGrid, isMobileWeb && styles.webPublishFormGridMobile]}>
            <WebPublishInput onChangeText={(value) => onUpdate('city', value)} placeholder="Cidade ou endereço do carro" value={form.city} />
            <WebPublishInput keyboardType="decimal-pad" onChangeText={(value) => onUpdate('dailyPrice', value)} placeholder="Preço por dia" value={form.dailyPrice} />
          </View>
        </View>
      );
    }

    if (step === 'mileage') {
      return (
        <View style={styles.webPublishWizardCenter}>
          <Text style={styles.webPublishWizardTitle}>E qual a quilometragem dele?</Text>
          <Text style={styles.webPublishWizardSubtitle}>Essa informação ajuda o cliente a entender o estado atual do veículo.</Text>
          <Text style={styles.webPublishMileagePreview}>{form.mileage || '0'}km</Text>
          <WebPublishInput keyboardType="numeric" onChangeText={(value) => onUpdate('mileage', value)} placeholder="Adicionar a quilometragem" value={form.mileage} />
        </View>
      );
    }

    if (step === 'features') {
      return (
        <View style={styles.webPublishWizardContent}>
          <Text style={styles.webPublishWizardTitle}>Informe os itens de série do seu veículo.</Text>
          <Text style={styles.webPublishWizardSubtitle}>Informe o máximo de detalhes para atrair ainda mais contatos.</Text>
          {featureGroups.map((group) => (
            <View key={group.title} style={styles.webPublishFeatureGroup}>
              <Text style={styles.webPublishFeatureTitle}>{group.title}</Text>
              <View style={styles.webPublishChipRow}>
                {group.items.map((feature) => (
                  <PublishChip
                    key={feature}
                    label={feature}
                    selected={form.features.includes(feature)}
                    onPress={() => onToggleFeature(feature)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (step === 'technical') {
      return (
        <View style={styles.webPublishWizardContent}>
          <Text style={styles.webPublishWizardTitle}>Últimos detalhes técnicos. <Text style={styles.webPublishOptional}>(Opcional)</Text></Text>
          <Text style={styles.webPublishWizardSubtitle}>Essas informações ajudam os clientes a encontrar exatamente o que procuram.</Text>
          <View style={[styles.webPublishFormGrid, isMobileWeb && styles.webPublishFormGridMobile]}>
            <WebPublishInput onChangeText={(value) => onUpdate('brand', value)} placeholder="Marca do veículo" value={form.brand} />
            <WebPublishInput onChangeText={(value) => onUpdate('model', value)} placeholder="Modelo do veículo" value={form.model} />
            <WebPublishInput onChangeText={(value) => onUpdate('doors', value)} placeholder="Portas" value={form.doors} />
            <WebPublishInput onChangeText={(value) => onUpdate('fuel', value)} placeholder="Combustível" value={form.fuel} />
            <WebPublishInput onChangeText={(value) => onUpdate('steering', value)} placeholder="Direção" value={form.steering} />
            <WebPublishInput onChangeText={(value) => onUpdate('enginePower', value)} placeholder="Potência do motor" value={form.enginePower} />
            <WebPublishInput onChangeText={(value) => onUpdate('color', value)} placeholder="Cor" value={form.color} />
          </View>
          <Text style={styles.webPublishFeatureTitle}>Marcas usadas no Brasil</Text>
          <View style={styles.webPublishChipRow}>
            {brazilCarBrands.map((brand) => (
              <PublishChip key={brand} label={brand} selected={form.brand === brand} onPress={() => onUpdate('brand', brand)} />
            ))}
          </View>
          <Text style={styles.webPublishFeatureTitle}>
            {form.brand ? `Modelos ${form.brand}` : 'Modelos da marca selecionada'}
          </Text>
          <View style={styles.webPublishChipRow}>
            {selectedBrandModels.length > 0 ? (
              selectedBrandModels.map((model) => (
                <PublishChip key={model} label={model} selected={form.model === model} onPress={() => onUpdate('model', model)} />
              ))
            ) : (
              <Text style={styles.webPublishWizardSubtitle}>Selecione uma marca para ver os modelos disponíveis.</Text>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.webPublishWizardContent}>
        <Text style={styles.webPublishWizardTitle}>Adicione 4 fotos do veículo.</Text>
        <Text style={styles.webPublishWizardSubtitle}>Use fotos bem iluminadas e mostre o veículo por vários ângulos.</Text>
        <View style={[styles.webPublishPhotoGrid, isMobileWeb && styles.webPublishPhotoGridMobile]}>
          {[0, 1, 2, 3].map((photoIndex) => (
            <Pressable key={photoIndex} onPress={onAddPhoto} style={styles.webPublishPhotoSlot}>
              {form.photos[photoIndex] ? (
                <>
                  <Ionicons color="#159A57" name="checkmark-circle" size={30} />
                  <Text style={styles.webPublishPhotoText}>{form.photos[photoIndex]}</Text>
                </>
              ) : (
                <>
                  <Ionicons color="#00102D" name="camera-outline" size={30} />
                  <Text style={styles.webPublishPhotoText}>Adicionar foto</Text>
                </>
              )}
            </Pressable>
          ))}
        </View>
        <Text style={styles.webPublishPhotoHint}>{form.photos.length}/4 fotos adicionadas</Text>
        {!!feedback && <Text style={styles.webPublishFeedback}>{feedback}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.webPublishWizardPage}>
      <StatusBar style="dark" />
      <View style={styles.webPublishWizardHeader}>
        <Pressable onPress={onClose}>
          <GhostcarLogo color="#00102D" size="small" />
        </Pressable>
        <Pressable onPress={onClose} style={styles.webPublishCloseButton}>
          <Ionicons color="#00102D" name="close" size={26} />
        </Pressable>
      </View>
      <View style={styles.webPublishWizardBody}>{renderStep()}</View>
      <View style={styles.webPublishWizardFooter}>
        <View style={styles.webPublishProgressTrack}>
          <View style={[styles.webPublishProgressFill, { width: progress }]} />
        </View>
        <View style={styles.webPublishFooterActions}>
          <Pressable onPress={onBack}>
            <Text style={styles.webPublishBackText}>Voltar</Text>
          </Pressable>
          {step === 'photos' ? (
            <Pressable disabled={isPublishing} onPress={onPublish} style={styles.webPublishNextButton}>
              {isPublishing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.webPublishNextText}>Publicar anúncio</Text>}
            </Pressable>
          ) : (
            <Pressable onPress={onNext} style={styles.webPublishNextButton}>
              <Text style={styles.webPublishNextText}>{step === 'intro' ? 'Entendi, vamos começar' : 'Continuar'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function PublishChip({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.webPublishChip, selected && styles.webPublishChipSelected]}>
      <Text style={[styles.webPublishChipText, selected && styles.webPublishChipTextSelected]}>{label} +</Text>
    </Pressable>
  );
}

function WebSignupPage({ onBack, onSignupComplete }: { onBack: () => void; onSignupComplete: (user: AuthUser) => void }) {
  const width = useStableWebWidth();
  const isMobileWeb = width < 820;
  const [form, setForm] = useState({
    birthDate: '',
    country: 'Brasil',
    cpf: '',
    email: '',
    emailConfirmation: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirmation: '',
    phone: '',
  });
  const [signupError, setSignupError] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  function updateSignupField(field: keyof typeof form, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setSignupError('');
  }

  async function createAccount() {
    const email = form.email.trim().toLowerCase();
    const emailConfirmation = form.emailConfirmation.trim().toLowerCase();

    if (!form.firstName.trim() || !form.lastName.trim() || !email || !form.password) {
      setSignupError('Preencha os campos obrigatórios.');
      return;
    }

    if (email !== emailConfirmation) {
      setSignupError('Os e-mails não são iguais.');
      return;
    }

    if (form.password !== form.passwordConfirmation) {
      setSignupError('As senhas não são iguais.');
      return;
    }

    if (form.password.length < 8) {
      setSignupError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setIsCreatingAccount(true);

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        body: JSON.stringify({
          birthDate: form.birthDate,
          country: form.country,
          cpf: form.cpf,
          email,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          passwordConfirmation: form.passwordConfirmation,
          phone: form.phone,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = (await response.json()) as { error?: string; sessionToken?: string; user?: AuthUser };

      if (!response.ok || !data.user || !data.sessionToken) {
        if (response.status === 409) {
          setSignupError('Este e-mail já está cadastrado.');
        } else {
          setSignupError(data.error || 'Não foi possível criar a conta.');
        }
        return;
      }

      storeWebSessionToken(data.sessionToken);
      onSignupComplete(data.user);
      onBack();
    } catch {
      setSignupError('Não foi possível criar a conta. Tente novamente.');
    } finally {
      setIsCreatingAccount(false);
    }
  }

  return (
    <View style={styles.webSignupPage}>
      <StatusBar style="dark" />
      <View style={[styles.webSignupHeader, isMobileWeb && styles.webSignupHeaderMobile]}>
        <Pressable onPress={onBack}>
          <GhostcarLogo color="#00102D" size={isMobileWeb ? 'small' : 'medium'} />
        </Pressable>
        <View style={[styles.webSignupHeaderNav, isMobileWeb && styles.webSignupHeaderNavMobile]}>
          <Text style={styles.webSignupHeaderItem}>🇧🇷</Text>
          <Text style={styles.webSignupHeaderItem}>R$</Text>
          <Text style={styles.webSignupHeaderItem}>Ajuda</Text>
          <Pressable onPress={onBack}>
            <Text style={styles.webSignupHeaderItem}>Entrar</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.webSignupContent, isMobileWeb && styles.webSignupContentMobile]}>
        <View style={[styles.webSignupSocialCard, isMobileWeb && styles.webSignupSocialCardMobile]}>
          <Text style={styles.webSignupSocialTitle}>
            Acelere seu cadastro usando sua conta das redes sociais
          </Text>
          <Pressable onPress={() => openGoogleSignIn('signup')} style={styles.webSignupGoogleButton}>
            <Image
              contentFit="contain"
              source={require('@/assets/images/google-g-logo.png')}
              style={styles.webSignupGoogleIcon}
            />
            <Text style={styles.webSignupGoogleText}>Fazer Login com o Google</Text>
          </Pressable>
          <Pressable style={styles.webSignupAppleButton}>
            <Ionicons color="#FFFFFF" name="logo-apple" size={21} />
            <Text style={styles.webSignupAppleText}>Apple</Text>
          </Pressable>
          <View style={styles.webSignupPrivacyRow}>
            <Ionicons color="#4B5260" name="lock-closed" size={14} />
            <Text style={styles.webSignupPrivacyText}>
              Seus dados serão mantidos em sigilo e nada será publicado em sua timeline
            </Text>
          </View>
        </View>

        <View style={styles.webSignupMain}>
          <Text style={styles.webSignupTitle}>Crie sua conta</Text>
          <Text style={styles.webSignupSectionTitle}>Dados pessoais</Text>
          <View style={[styles.webSignupGrid, isMobileWeb && styles.webSignupGridMobile]}>
            <WebSignupInput label="Nome do locatário:" onChangeText={(value) => updateSignupField('firstName', value)} placeholder="Nome do locatário" required value={form.firstName} />
            <WebSignupInput label="Sobrenome:" onChangeText={(value) => updateSignupField('lastName', value)} placeholder="Sobrenome" required value={form.lastName} />
            <WebSignupInput label="País de Residência:" onChangeText={(value) => updateSignupField('country', value)} placeholder="Brasil" required value={form.country} />
            <WebSignupInput label="CPF:" onChangeText={(value) => updateSignupField('cpf', value)} required value={form.cpf} />
            <WebSignupInput label="Data de Nascimento:" onChangeText={(value) => updateSignupField('birthDate', value)} placeholder="DD/MM/AAAA" required value={form.birthDate} />
            <WebSignupInput label="Celular:" onChangeText={(value) => updateSignupField('phone', value)} placeholder="Ex.: (11) 96123-4567" required value={form.phone} />
          </View>

          <Text style={styles.webSignupSectionTitle}>Dados de acesso à Ghostcar</Text>
          <View style={[styles.webSignupGrid, isMobileWeb && styles.webSignupGridMobile]}>
            <WebSignupInput label="E-mail:" keyboardType="email-address" onChangeText={(value) => updateSignupField('email', value)} required value={form.email} />
            <WebSignupInput label="Confirme seu E-mail:" keyboardType="email-address" onChangeText={(value) => updateSignupField('emailConfirmation', value)} required value={form.emailConfirmation} />
            <WebSignupInput label="Crie uma Senha de Acesso:" onChangeText={(value) => updateSignupField('password', value)} secureTextEntry required value={form.password} />
            <WebSignupInput label="Confirme sua Senha de Acesso:" onChangeText={(value) => updateSignupField('passwordConfirmation', value)} secureTextEntry required value={form.passwordConfirmation} />
          </View>

          <View style={styles.webSignupCheckboxRow}>
            <View style={styles.webSignupCheckbox} />
            <Text style={styles.webSignupSmallText}>Aceito receber todas as ofertas e promoções da Ghostcar</Text>
          </View>

          <Text style={styles.webSignupTerms}>
            Ao seguir utilizando nossas soluções você está ciente de que seus dados pessoais serão tratados conforme a{' '}
            <Text style={styles.webSignupLink}>Política de Privacidade</Text> da Ghostcar. Ao criar uma conta você concorda com os{' '}
            <Text style={styles.webSignupLink}>Termos de Uso</Text> da Ghostcar.
          </Text>

          {signupError ? <Text style={styles.webSignupErrorText}>{signupError}</Text> : null}

          <Pressable
            disabled={isCreatingAccount}
            onPress={createAccount}
            style={[styles.webSignupCreateButton, isCreatingAccount && styles.webSignupCreateButtonDisabled, isMobileWeb && styles.webSignupCreateButtonMobile]}>
            <Text style={styles.webSignupCreateButtonText}>
              {isCreatingAccount ? 'Criando conta...' : 'Criar Conta'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function WebPublishInput({
  keyboardType,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: TextInputProps['keyboardType'];
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <TextInput
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#8C9693"
      style={styles.webPublishInput}
      value={value}
    />
  );
}

function WebSignupInput({
  keyboardType,
  label,
  onChangeText,
  placeholder,
  required,
  secureTextEntry,
  value,
}: {
  keyboardType?: TextInputProps['keyboardType'];
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  value: string;
}) {
  return (
    <View style={styles.webSignupField}>
      <Text style={styles.webSignupLabel}>
        {required && <Text style={styles.webSignupRequired}>* </Text>}
        {label}
      </Text>
      <TextInput
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8C9693"
        secureTextEntry={secureTextEntry}
        style={styles.webSignupInput}
        value={value}
      />
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
    width: '100%',
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
    fontSize: 22,
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
    marginBottom: 7,
    color: '#555555',
    fontSize: 13,
  },
  signupInput: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#C8CECC',
    borderRadius: 11,
    color: '#202020',
    fontSize: 14,
    ...Platform.select({
      web: {
        height: 52,
        fontSize: 14,
      },
    }),
  },
  nativeSignupInput: {
    marginBottom: 18,
  },
  emailContinueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginTop: 26,
    borderRadius: 10,
    backgroundColor: '#16865F',
    ...Platform.select({
      web: {
        height: 50,
        marginTop: 18,
      },
    }),
  },
  emailContinueButtonDisabled: {
    backgroundColor: '#B8DCCB',
    opacity: 0.75,
  },
  emailContinueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  signupBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    marginBottom: 14,
    marginLeft: -6,
  },
  signupDescription: {
    marginTop: 14,
    marginBottom: 22,
    color: '#222222',
    fontSize: 13,
    lineHeight: 20,
  },
  verifiedEmailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    marginBottom: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 11,
    backgroundColor: '#F7F7F7',
  },
  verifiedEmailText: {
    flex: 1,
    color: '#6E6E6E',
    fontSize: 13,
    fontWeight: '600',
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 56,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C8CECC',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 124,
    borderRightWidth: 1,
    borderRightColor: '#C8CECC',
    gap: 10,
  },
  phoneFlag: {
    fontSize: 24,
  },
  phonePrefixText: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '700',
  },
  phoneNumberInput: {
    flex: 1,
    paddingHorizontal: 16,
    color: '#202020',
    fontSize: 13,
  },
  nativeSignupCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  nativeSignupCheckbox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#5E5E5E',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  nativeSignupCheckboxChecked: {
    borderColor: '#00102D',
    backgroundColor: '#00102D',
  },
  nativeSignupCheckboxText: {
    flex: 1,
    color: '#606060',
    fontSize: 13,
  },
  nativeSignupSubmitButton: {
    marginTop: 28,
    backgroundColor: '#00102D',
  },
  nativeSignupErrorText: {
    marginTop: 18,
    color: '#B42318',
    fontSize: 14,
    fontWeight: '700',
  },
  nativeSignupTerms: {
    marginTop: 24,
    color: '#111111',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  nativeSignupLink: {
    color: '#1976B8',
    textDecorationLine: 'underline',
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
  webHeaderOnHero: {
    position: 'relative',
    zIndex: 2,
    paddingTop: 30,
    paddingBottom: 18,
  },
  webHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 15,
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
  webNavMobile: {
    width: '100%',
    flexWrap: 'wrap',
    gap: 8,
  },
  webNavLink: {
    color: '#33413E',
    fontSize: 14,
    fontWeight: '600',
  },
  webNavLinkOnHero: {
    color: '#FFFFFF',
  },
  webLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#C7D9D4',
    borderRadius: 8,
  },
  webLoginButtonMobile: {
    minWidth: 104,
    paddingHorizontal: 12,
  },
  webLoginButtonOnHero: {
    borderColor: 'rgba(255, 255, 255, 0.58)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  webAccountButtonOnHero: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  webAccountAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F7B31A',
  },
  webAccountAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  webLoginText: {
    color: '#00102D',
    fontSize: 14,
    fontWeight: '700',
  },
  webLoginTextOnHero: {
    color: '#FFFFFF',
  },
  webLoginPanelWrap: {
    position: 'absolute',
    top: 66,
    right: 26,
    zIndex: 20,
    width: '100%',
    maxWidth: 850,
  },
  webLoginPanelWrapMobile: {
    position: 'relative',
    top: 0,
    right: 0,
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  webAccountPanelWrap: {
    maxWidth: 320,
  },
  webLoginPanel: {
    position: 'relative',
    flexDirection: 'row',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#E3E6EA',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  webLoginPanelMobile: {
    flexDirection: 'column',
    width: '100%',
    borderRadius: 8,
  },
  webAccountPanel: {
    position: 'relative',
    overflow: 'visible',
    width: 320,
    borderWidth: 1,
    borderColor: '#E3E6EA',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  webAccountPanelMobile: {
    width: '100%',
    borderRadius: 8,
  },
  webAccountHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAEE',
  },
  webAccountName: {
    color: '#2E3542',
    fontSize: 16,
    fontWeight: '600',
  },
  webAccountEmail: {
    marginTop: 4,
    color: '#687180',
    fontSize: 14,
    fontWeight: '400',
  },
  webAccountMenu: {
    paddingVertical: 14,
  },
  webAccountMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  webAccountMenuText: {
    color: '#4B5260',
    fontSize: 16,
    fontWeight: '600',
  },
  webLoginArrow: {
    position: 'absolute',
    top: -10,
    right: 52,
    width: 20,
    height: 20,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E3E6EA',
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  webSignupColumn: {
    flex: 1,
    padding: 24,
    borderRightWidth: 1,
    borderRightColor: '#E7EAEE',
  },
  webLoginColumn: {
    flex: 1,
    padding: 24,
  },
  webLoginColumnMobile: {
    width: '100%',
    borderRightWidth: 0,
    padding: 16,
  },
  webLoginPanelTitle: {
    color: '#41495A',
    fontSize: 20,
    fontWeight: '500',
  },
  webSignupButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 28,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#D7DCE2',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  webSignupButtonText: {
    color: '#41495A',
    fontSize: 18,
    fontWeight: '600',
  },
  webLoginBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  webLoginBenefitText: {
    flex: 1,
    color: '#4B5260',
    fontSize: 15,
    fontWeight: '500',
  },
  webLoginLabel: {
    marginTop: 28,
    marginBottom: 9,
    color: '#59606D',
    fontSize: 17,
    fontWeight: '500',
  },
  webLoginInput: {
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D7DCE2',
    borderRadius: 4,
    color: '#263532',
    fontSize: 15,
  },
  webForgotText: {
    marginTop: 18,
    color: '#2B6CB0',
    fontSize: 16,
    fontWeight: '500',
  },
  webLoginErrorText: {
    marginTop: 14,
    color: '#B42318',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  webLoginSubmitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 22,
    borderRadius: 4,
    backgroundColor: '#159A57',
  },
  webLoginSubmitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  webLoginDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 24,
  },
  webLoginDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3E6EA',
  },
  webLoginDividerText: {
    color: '#59606D',
    fontSize: 15,
    fontWeight: '600',
  },
  webSocialRow: {
    flexDirection: 'row',
    gap: 28,
    justifyContent: 'center',
  },
  webSocialRowMobile: {
    gap: 10,
  },
  webSocialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 112,
    height: 52,
    borderWidth: 1,
    borderColor: '#E1E5EA',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  webSocialButtonMobile: {
    flex: 1,
    width: 'auto',
  },
  webSocialIcon: {
    width: 28,
    height: 28,
  },
  webSignupPage: {
    minHeight: '100%',
    backgroundColor: '#FFFFFF',
  },
  webSignupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 54,
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
  },
  webSignupHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  webSignupHeaderNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
  },
  webSignupHeaderNavMobile: {
    width: '100%',
    flexWrap: 'wrap',
    gap: 18,
  },
  webSignupHeaderItem: {
    color: '#41495A',
    fontSize: 15,
    fontWeight: '600',
  },
  webSignupContent: {
    flexDirection: 'row',
    gap: 42,
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 42,
    paddingTop: 34,
    paddingBottom: 70,
  },
  webSignupContentMobile: {
    flexDirection: 'column',
    gap: 22,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 42,
  },
  webSignupSocialCard: {
    width: 340,
    alignSelf: 'flex-start',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E5EA',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  webSignupSocialCardMobile: {
    width: '100%',
    alignSelf: 'stretch',
  },
  webSignupSocialTitle: {
    color: '#4B5260',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  webSignupGoogleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    height: 44,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#DCE1E7',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  webSignupGoogleIcon: {
    width: 22,
    height: 22,
  },
  webSignupGoogleText: {
    color: '#41495A',
    fontSize: 14,
    fontWeight: '700',
  },
  webSignupAppleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 44,
    marginTop: 10,
    borderRadius: 3,
    backgroundColor: '#171B22',
  },
  webSignupAppleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  webSignupPrivacyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  webSignupPrivacyText: {
    flex: 1,
    color: '#4B5260',
    fontSize: 13,
    lineHeight: 19,
  },
  webSignupMain: {
    flex: 1,
  },
  webSignupTitle: {
    color: '#343B49',
    fontSize: 28,
    fontWeight: '900',
  },
  webSignupSectionTitle: {
    marginTop: 20,
    marginBottom: 12,
    color: '#343B49',
    fontSize: 18,
    fontWeight: '900',
  },
  webSignupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 28,
    rowGap: 18,
  },
  webSignupGridMobile: {
    flexDirection: 'column',
    rowGap: 14,
  },
  webSignupField: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 260,
  },
  webSignupLabel: {
    marginBottom: 8,
    color: '#59606D',
    fontSize: 13,
    fontWeight: '700',
  },
  webSignupRequired: {
    color: '#A94442',
  },
  webSignupInput: {
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#C8CED6',
    borderRadius: 2,
    color: '#263532',
    fontSize: 13,
  },
  webSignupCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
  },
  webSignupCheckbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#9FA7B2',
    borderRadius: 2,
  },
  webSignupSmallText: {
    flex: 1,
    color: '#4B5260',
    fontSize: 13,
  },
  webSignupTerms: {
    marginTop: 18,
    color: '#4B5260',
    fontSize: 13,
    lineHeight: 20,
  },
  webSignupLink: {
    color: '#2B6CB0',
    fontWeight: '700',
  },
  webSignupCreateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    maxWidth: 460,
    marginTop: 24,
    borderRadius: 3,
    backgroundColor: '#159A57',
  },
  webSignupCreateButtonDisabled: {
    backgroundColor: '#8FCBAE',
  },
  webSignupCreateButtonMobile: {
    width: '100%',
    maxWidth: '100%',
  },
  webSignupCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  webSignupErrorText: {
    marginTop: 18,
    color: '#B42318',
    fontSize: 13,
    fontWeight: '700',
  },
  webHero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#00102D',
    minHeight: 620,
    paddingBottom: 70,
  },
  webHeroMobile: {
    minHeight: 680,
    paddingBottom: 42,
  },
  webHeroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  webHeroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 16, 45, 0.62)',
  },
  webHeroContent: {
    position: 'relative',
    zIndex: 1,
    paddingTop: 50,
  },
  webSection: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 26,
  },
  webSectionMobile: {
    paddingHorizontal: 18,
  },
  webHeroTitle: {
    maxWidth: 710,
    color: '#FFFFFF',
    fontSize: 39,
    fontWeight: '900',
    letterSpacing: -1.4,
    lineHeight: 48,
  },
  webHeroTitleMobile: {
    fontSize: 33,
    letterSpacing: -1.1,
    lineHeight: 41,
  },
  webHeroSubtitle: {
    maxWidth: 660,
    marginTop: 10,
    color: '#D7F1EA',
    fontSize: 17,
    lineHeight: 25,
  },
  webHeroSubtitleMobile: {
    fontSize: 15,
    lineHeight: 23,
  },
  webSearchCard: {
    marginTop: 34,
    maxWidth: 1060,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  webSearchCardMobile: {
    marginTop: 26,
    padding: 16,
  },
  webHeroTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  webHeroTab: {
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  webHeroTabActive: {
    color: '#1C2926',
    backgroundColor: '#FFB21C',
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
  webSearchRowMobile: {
    flexDirection: 'column',
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
  webSearchButtonMobile: {
    width: '100%',
    minHeight: 54,
  },
  webSearchButtonText: {
    color: '#1C2926',
    fontSize: 15,
    fontWeight: '900',
  },
  webSuggestions: {
    marginTop: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D8E3DF',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  webSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F0',
  },
  webSuggestionText: {
    flex: 1,
    color: '#24312E',
    fontSize: 13,
    lineHeight: 18,
  },
  webSearchHint: {
    marginTop: 10,
    color: '#75817F',
    fontSize: 12,
  },
  webSearchError: {
    marginTop: 10,
    color: '#B42318',
    fontSize: 12,
    fontWeight: '700',
  },
  webResultsSection: {
    paddingTop: 42,
    paddingBottom: 12,
  },
  webResultsStatus: {
    marginTop: 28,
  },
  webResultsStatusText: {
    marginTop: 16,
    color: '#64716E',
    fontSize: 15,
    lineHeight: 22,
  },
  webCarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 28,
  },
  webCarsGridMobile: {
    flexDirection: 'column',
  },
  webCarCard: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 260,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DFE8E5',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  webCarImage: {
    width: '100%',
    height: 170,
  },
  webCarImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 170,
    backgroundColor: '#EEF6F3',
  },
  webCarContent: {
    padding: 16,
  },
  webCarTitle: {
    color: '#1E2B28',
    fontSize: 17,
    fontWeight: '900',
  },
  webCarMeta: {
    marginTop: 5,
    color: '#6B7875',
    fontSize: 13,
  },
  webCarPrice: {
    marginTop: 13,
    color: '#00102D',
    fontSize: 18,
    fontWeight: '900',
  },
  webCarPriceUnit: {
    color: '#6B7875',
    fontSize: 12,
    fontWeight: '700',
  },
  webBenefits: {
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 42,
  },
  webBenefitsMobile: {
    flexDirection: 'column',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 28,
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
  webSectionTitleMobile: {
    fontSize: 24,
    letterSpacing: -0.5,
    lineHeight: 31,
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
  webFeatureGridMobile: {
    flexDirection: 'column',
    marginTop: 24,
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
  webPublishSectionMobile: {
    flexDirection: 'column',
    paddingHorizontal: 18,
    paddingVertical: 42,
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
  webPublishForm: {
    marginTop: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DDE8E4',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  webPublishFormTitle: {
    marginBottom: 14,
    color: '#24312E',
    fontSize: 16,
    fontWeight: '900',
  },
  webPublishFormGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  webPublishFormGridMobile: {
    flexDirection: 'column',
  },
  webPublishInput: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 210,
    height: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#C8D5D1',
    borderRadius: 8,
    color: '#263532',
    fontSize: 13,
  },
  webPublishFeedback: {
    marginTop: 12,
    color: '#00102D',
    fontSize: 12,
    fontWeight: '800',
  },
  webPublishSubmitButton: {
    width: '100%',
    height: 50,
    marginTop: 14,
  },
  webPublishWizardPage: {
    flex: 1,
    minHeight: 720,
    backgroundColor: '#FFFFFF',
  },
  webPublishWizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 46,
    paddingTop: 34,
  },
  webPublishCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#DDE6F2',
    backgroundColor: '#FFFFFF',
  },
  webPublishWizardBody: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 880,
    marginHorizontal: 'auto',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  webPublishWizardIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 50,
  },
  webPublishWizardIntroMobile: {
    flexDirection: 'column',
    gap: 24,
  },
  webPublishWizardCarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: '#DDE6F2',
    backgroundColor: '#F4F8FC',
  },
  webPublishWizardIntroCopy: {
    maxWidth: 420,
  },
  webPublishStepLabel: {
    color: '#59606D',
    fontSize: 13,
    fontWeight: '700',
  },
  webPublishWizardTitle: {
    color: '#252C3A',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  webPublishWizardSubtitle: {
    marginTop: 10,
    color: '#69717F',
    fontSize: 15,
    lineHeight: 22,
  },
  webPublishWizardCenter: {
    alignItems: 'center',
    gap: 20,
  },
  webPublishWizardContent: {
    width: '100%',
  },
  webPublishPlateBox: {
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#00102D',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  webPublishPlateHeader: {
    paddingVertical: 12,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    backgroundColor: '#00102D',
  },
  webPublishPlateInput: {
    height: 86,
    paddingHorizontal: 24,
    color: '#00102D',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 5,
    textAlign: 'center',
  },
  webPublishMileagePreview: {
    color: '#252C3A',
    fontSize: 58,
    fontWeight: '900',
  },
  webPublishFeatureGroup: {
    marginTop: 30,
  },
  webPublishFeatureTitle: {
    marginTop: 20,
    marginBottom: 12,
    color: '#343B49',
    fontSize: 15,
    fontWeight: '800',
  },
  webPublishChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  webPublishChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#D4DAE3',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  webPublishChipSelected: {
    borderColor: '#00102D',
    backgroundColor: '#00102D',
  },
  webPublishChipText: {
    color: '#343B49',
    fontSize: 13,
    fontWeight: '700',
  },
  webPublishChipTextSelected: {
    color: '#FFFFFF',
  },
  webPublishOptional: {
    color: '#A8AFBA',
    fontWeight: '600',
  },
  webPublishPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 28,
  },
  webPublishPhotoGridMobile: {
    flexDirection: 'column',
  },
  webPublishPhotoSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    flexBasis: '47%',
    minHeight: 150,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C5CBD5',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  webPublishPhotoText: {
    marginTop: 10,
    color: '#343B49',
    fontSize: 14,
    fontWeight: '800',
  },
  webPublishPhotoHint: {
    marginTop: 12,
    color: '#59606D',
    fontSize: 13,
    fontWeight: '700',
  },
  webPublishWizardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#DDE6F2',
    backgroundColor: '#FFFFFF',
  },
  webPublishProgressTrack: {
    height: 5,
    backgroundColor: '#DDE6F2',
  },
  webPublishProgressFill: {
    height: 5,
    backgroundColor: '#00102D',
  },
  webPublishFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 42,
    paddingVertical: 24,
  },
  webPublishBackText: {
    color: '#00102D',
    fontSize: 15,
    fontWeight: '800',
  },
  webPublishNextButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 170,
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 27,
    backgroundColor: '#00102D',
  },
  webPublishNextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  webPublishVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '38%',
    minHeight: 240,
    borderRadius: 18,
    backgroundColor: '#00102D',
  },
  webPublishVisualMobile: {
    width: '100%',
    minHeight: 190,
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
    backgroundColor: '#00102D',
  },
  webFooterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 50,
    paddingBottom: 30,
  },
  webFooterGridMobile: {
    flexDirection: 'column',
    gap: 24,
    paddingHorizontal: 18,
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
    borderTopColor: '#1A2948',
    color: '#9DB5AF',
    fontSize: 11,
    textAlign: 'center',
  },
});

function formatDistance(distanceKm: number | null) {
  return distanceKm == null ? '' : `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { currency, style: 'currency' }).format(price);
}

function formatPhotonSuggestion(properties: PhotonFeature['properties']) {
  return [
    properties.name,
    properties.street,
    properties.district,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(', ');
}
