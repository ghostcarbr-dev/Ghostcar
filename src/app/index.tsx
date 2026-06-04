import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

async function openGoogleSignIn() {
  const returnTo = Platform.OS === 'web' ? window.location.origin : 'https://ghostcar.com.br';
  const googleSignInUrl = `${apiUrl}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;

  if (Platform.OS === 'web') {
    window.location.href = googleSignInUrl;
    return;
  }

  await WebBrowser.openBrowserAsync(googleSignInUrl);
}

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
            <GhostcarLogo align="center" color="#FFFFFF" size="hero" />
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

              <Pressable
                onPress={openGoogleSignIn}
                style={({ pressed }) => [styles.googleButton, styles.signupSocialButton, pressed && styles.pressed]}>
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

              <Pressable
                onPress={openGoogleSignIn}
                style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
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
  const { width } = useWindowDimensions();
  const [destination, setDestination] = useState('');
  const [cars, setCars] = useState<CarListing[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isPublishingCar, setIsPublishingCar] = useState(false);
  const [isPublishFormOpen, setIsPublishFormOpen] = useState(false);
  const [isWebSignupPageOpen, setIsWebSignupPageOpen] = useState(false);
  const [isWebLoginOpen, setIsWebLoginOpen] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState('');
  const [publishForm, setPublishForm] = useState({
    category: '',
    city: '',
    dailyPrice: '',
    ownerName: '',
    title: '',
  });
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

    async function loadCurrentUser() {
      try {
        const response = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' });
        if (!response.ok) {
          setWebUser(null);
          return;
        }

        const data = (await response.json()) as { user: AuthUser | null };
        setWebUser(data.user);
      } catch {
        setWebUser(null);
      }
    }

    loadCurrentUser();
  }, []);

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
    setPublishForm((currentForm) => ({ ...currentForm, [field]: value }));
    setPublishFeedback('');
  }

  function openPublishForm() {
    setIsPublishFormOpen(true);
    setPublishFeedback('');

    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        document
          .getElementById('web-publish-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  async function publishWebCar() {
    const ownerName = publishForm.ownerName.trim();
    const title = publishForm.title.trim();
    const category = publishForm.category.trim();
    const city = publishForm.city.trim();
    const dailyPrice = Number(publishForm.dailyPrice.replace(',', '.'));

    if (!ownerName || !title || !category || !city || !Number.isFinite(dailyPrice) || dailyPrice <= 0) {
      setPublishFeedback('Preencha todos os campos com um preço válido.');
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

      setPublishForm({ category: '', city: '', dailyPrice: '', ownerName: '', title: '' });
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
    return <WebSignupPage onBack={closeWebSignupPage} />;
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
              onPress={() => setIsWebLoginOpen((isOpen) => !isOpen)}
              style={[styles.webLoginButton, styles.webLoginButtonOnHero, isMobileWeb && styles.webLoginButtonMobile]}>
              <Ionicons color="#FFFFFF" name="person-outline" size={18} />
              <Text style={[styles.webLoginText, styles.webLoginTextOnHero]}>
                {webUser?.name?.split(' ')[0] || 'Entrar'}
              </Text>
            </Pressable>
          </View>
        </View>
        {isWebLoginOpen && (
          <View style={[styles.webLoginPanelWrap, isMobileWeb && styles.webLoginPanelWrapMobile]}>
            <View style={[styles.webLoginPanel, isMobileWeb && styles.webLoginPanelMobile]}>
              <View style={styles.webLoginArrow} />
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
                    onPress={openGoogleSignIn}
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
              </View>
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
          {isPublishFormOpen && (
            <View style={styles.webPublishForm}>
              <Text style={styles.webPublishFormTitle}>Publique seu carro</Text>
              <View style={[styles.webPublishFormGrid, isMobileWeb && styles.webPublishFormGridMobile]}>
                <WebPublishInput
                  onChangeText={(value) => updatePublishForm('ownerName', value)}
                  placeholder="Seu nome"
                  value={publishForm.ownerName}
                />
                <WebPublishInput
                  onChangeText={(value) => updatePublishForm('title', value)}
                  placeholder="Modelo do carro"
                  value={publishForm.title}
                />
                <WebPublishInput
                  onChangeText={(value) => updatePublishForm('category', value)}
                  placeholder="Categoria"
                  value={publishForm.category}
                />
                <WebPublishInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => updatePublishForm('dailyPrice', value)}
                  placeholder="Preço por dia"
                  value={publishForm.dailyPrice}
                />
                <WebPublishInput
                  onChangeText={(value) => updatePublishForm('city', value)}
                  placeholder="Cidade ou endereço do carro"
                  value={publishForm.city}
                />
              </View>
              {!!publishFeedback && <Text style={styles.webPublishFeedback}>{publishFeedback}</Text>}
              <Pressable
                disabled={isPublishingCar}
                onPress={publishWebCar}
                style={[styles.webSearchButton, styles.webPublishSubmitButton]}>
                {isPublishingCar ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.webSearchButtonText}>Publicar anúncio</Text>
                )}
              </Pressable>
            </View>
          )}
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

function WebSignupPage({ onBack }: { onBack: () => void }) {
  const { width } = useWindowDimensions();
  const isMobileWeb = width < 820;

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
          <Pressable onPress={openGoogleSignIn} style={styles.webSignupGoogleButton}>
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
            <WebSignupInput label="Nome do locatário:" placeholder="Nome do locatário" required />
            <WebSignupInput label="Sobrenome:" placeholder="Sobrenome" required />
            <WebSignupInput label="País de Residência:" placeholder="Brasil" required />
            <WebSignupInput label="CPF:" required />
            <WebSignupInput label="Data de Nascimento:" placeholder="DD/MM/AAAA" required />
            <WebSignupInput label="Celular:" placeholder="Ex.: (11) 96123-4567" required />
          </View>

          <Text style={styles.webSignupSectionTitle}>Dados de acesso à Ghostcar</Text>
          <View style={[styles.webSignupGrid, isMobileWeb && styles.webSignupGridMobile]}>
            <WebSignupInput label="E-mail:" keyboardType="email-address" required />
            <WebSignupInput label="Confirme seu E-mail:" keyboardType="email-address" required />
            <WebSignupInput label="Crie uma Senha de Acesso:" secureTextEntry required />
            <WebSignupInput label="Confirme sua Senha de Acesso:" secureTextEntry required />
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

          <Pressable style={[styles.webSignupCreateButton, isMobileWeb && styles.webSignupCreateButtonMobile]}>
            <Text style={styles.webSignupCreateButtonText}>Criar Conta</Text>
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
  placeholder,
  required,
  secureTextEntry,
}: {
  keyboardType?: TextInputProps['keyboardType'];
  label: string;
  placeholder?: string;
  required?: boolean;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.webSignupField}>
      <Text style={styles.webSignupLabel}>
        {required && <Text style={styles.webSignupRequired}>* </Text>}
        {label}
      </Text>
      <TextInput
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#8C9693"
        secureTextEntry={secureTextEntry}
        style={styles.webSignupInput}
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
  webSignupCreateButtonMobile: {
    width: '100%',
    maxWidth: '100%',
  },
  webSignupCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
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
