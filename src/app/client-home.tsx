import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostcarLogo } from '@/components/GhostcarLogo';
import { languages, useLanguage } from '@/i18n';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type PlaceSuggestion = {
  coordinates: Coordinates;
  id: string;
  label: string;
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

const personalMenuItems = [
  { icon: 'home-outline', key: 'home' },
  { icon: 'ticket-outline', key: 'bookings' },
  { icon: 'car-outline', key: 'myCars' },
  { icon: 'car-sport-outline', key: 'publishCar' },
  { icon: 'person-circle-outline', key: 'myAccount' },
  { icon: 'settings-outline', key: 'settings' },
] as const;

const supportMenuItems = [
  { icon: 'help-circle-outline', key: 'helpCenter' },
  { icon: 'headset-outline', key: 'contactUs' },
  { icon: 'lock-closed-outline', key: 'privacyPolicy' },
  { icon: 'document-text-outline', key: 'terms' },
  { icon: 'information-circle-outline', key: 'about' },
] as const;

const currencies = [
  { code: 'BRL', flag: '🇧🇷', label: 'Real Brasileiro', symbol: 'R$' },
  { code: 'USD', flag: '🇺🇸', label: 'US Dollar', symbol: 'US$' },
  { code: 'EUR', flag: '🇪🇺', label: 'Euro', symbol: '€' },
  { code: 'GBP', flag: '🇬🇧', label: 'British Pound', symbol: '£' },
  { code: 'CNY', flag: '🇨🇳', label: 'Chinese Yuan', symbol: '¥' },
  { code: 'JPY', flag: '🇯🇵', label: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', flag: '🇮🇳', label: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', flag: '🇦🇪', label: 'UAE Dirham', symbol: 'AED' },
] as const;

const apiUrl = 'https://ghostcar-api.onrender.com';

export default function ClientHomeScreen() {
  const [destination, setDestination] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const params = useLocalSearchParams<{ clientName?: string }>();
  const { languageCode, setLanguageCode, t } = useLanguage();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const currentCoordinates = useRef<Coordinates | null>(null);
  const skipNextSuggestionFetch = useRef(false);
  const selectedLanguage =
    languages.find((language) => language.code === languageCode) ?? languages[0];
  const clientName = typeof params.clientName === 'string' ? params.clientName.trim().split(' ')[0] : '';
  const greetingBase = t('hello').replace(/[!！¡؟?]\s*$/u, '').trim();
  const greetingText = clientName ? `${greetingBase}, ${clientName}` : t('hello');
  const menuGreetingText = clientName ? `${greetingBase}, ${clientName}!` : t('hello');

  function showComingSoon(label: string) {
    Alert.alert('Em breve', `${label} ainda não está disponível no aplicativo.`);
  }

  async function openWhatsApp() {
    const url = 'https://wa.me/5500000000000';
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    showComingSoon('WhatsApp');
  }

  useEffect(() => {
    const query = destination.trim();

    if (skipNextSuggestionFetch.current) {
      skipNextSuggestionFetch.current = false;
      return;
    }

    if (query.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);

      try {
        const coordinates = currentCoordinates.current;
        const params = new URLSearchParams({
          limit: '5',
          q: query,
        });

        if (coordinates) {
          params.set('lat', String(coordinates.latitude));
          params.set('lon', String(coordinates.longitude));
        }

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
          })
        );
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [destination]);

  async function useCurrentLocation() {
    setIsLocating(true);
    setLocationError('');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationError(t('locationDenied'));
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      currentCoordinates.current = currentLocation.coords;
      const [address] = await Location.reverseGeocodeAsync(currentLocation.coords);

      if (!address) {
        selectDestination(
          `${currentLocation.coords.latitude.toFixed(5)}, ${currentLocation.coords.longitude.toFixed(5)}`
        );
        return;
      }

      selectDestination(
        [address.street, address.name, address.city, address.region].filter(Boolean).join(', ')
      );
    } catch {
      setLocationError(t('locationFailed'));
    } finally {
      setIsLocating(false);
    }
  }

  function selectDestination(label: string, coordinates?: Coordinates) {
    if (coordinates) {
      currentCoordinates.current = coordinates;
    }

    skipNextSuggestionFetch.current = true;
    setDestination(label);
    setSuggestions([]);
  }

  function selectNextLanguage() {
    const currentIndex = languages.findIndex((language) => language.code === languageCode);
    const nextLanguage = languages[(currentIndex + 1) % languages.length];
    setLanguageCode(nextLanguage.code);
  }

  function searchCars() {
    if (!destination.trim() || !currentCoordinates.current) {
      setLocationError(t('chooseDestination'));
      return;
    }

    setLocationError('');
    setSuggestions([]);
    setIsResultsOpen(true);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {isResultsOpen ? (
        <SearchResultsScreen
          coordinates={currentCoordinates.current!}
          destination={destination}
          onBack={() => setIsResultsOpen(false)}
          t={t}
        />
      ) : isMenuOpen ? (
        <ClientMenu
          clientName={clientName}
          greetingText={menuGreetingText}
          languageCode={languageCode}
          onBack={() => setIsMenuOpen(false)}
          setLanguageCode={setLanguageCode}
          t={t}
        />
      ) : (
      <ScrollView bounces={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image
            contentFit="cover"
            contentPosition={{ left: '56%', top: '48%' }}
            source={require('@/assets/images/ghostcar-hero-v2.png')}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroShade} />

          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            <View style={styles.topBar}>
              <View>
                <GhostcarLogo color="#FFFFFF" size="small" taglineColor="#FFCC2D" />
              </View>

              <View style={styles.headerActions}>
                <Pressable accessibilityLabel="Notificações" onPress={() => showComingSoon('Notificações')}>
                  <Ionicons color="#FFFFFF" name="notifications-outline" size={24} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Selecionar próximo idioma"
                  onPress={selectNextLanguage}
                  style={styles.languageBadge}>
                  <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
                </Pressable>
                <Pressable accessibilityLabel="Menu" onPress={() => setIsMenuOpen(true)}>
                  <Ionicons color="#FFFFFF" name="menu" size={31} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.greeting}>{greetingText}</Text>
          </SafeAreaView>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>{t('nextDestination')}</Text>
          <View style={styles.searchInput}>
            <Pressable accessibilityLabel="Usar minha localização atual" onPress={useCurrentLocation}>
              {isLocating ? (
                <ActivityIndicator color="#08735D" size="small" />
              ) : (
                <Ionicons color="#08735D" name="locate" size={24} />
              )}
            </Pressable>
            <TextInput
              placeholder={t('searchDestinations')}
              placeholderTextColor="#B0B0B0"
              value={destination}
              onChangeText={setDestination}
              style={styles.searchTextInput}
            />
            {isSearching && <ActivityIndicator color="#08735D" size="small" />}
          </View>
          {!!suggestions.length && (
            <View style={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  onPress={() => selectDestination(suggestion.label, suggestion.coordinates)}
                  style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionPressed]}>
                  <Ionicons color="#08735D" name="location-outline" size={19} />
                  <Text numberOfLines={2} style={styles.suggestionText}>
                    {suggestion.label}
                  </Text>
                </Pressable>
              ))}
              <Text style={styles.attribution}>{t('suggestions')}</Text>
            </View>
          )}
          {!!locationError && <Text style={styles.locationError}>{locationError}</Text>}
          <Pressable onPress={searchCars} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
            <Text style={styles.searchButtonText}>{t('search')}</Text>
          </Pressable>
        </View>

        <View style={styles.promotions}>
          <View style={styles.promoCard}>
            <Image
              contentFit="cover"
              source={require('@/assets/images/ghostcar-hero.png')}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.promoShade} />
            <View style={styles.promoContent}>
              <Text style={styles.promoEyebrow}>{t('planTrip')}</Text>
              <Text style={styles.promoTitle}>{t('nextPath')}</Text>
              <Text style={styles.promoSubtitle}>{t('idealCar')}</Text>
              <Pressable onPress={() => showComingSoon(t('seeOffers'))} style={({ pressed }) => [styles.promoButton, pressed && styles.pressed]}>
                <Text style={styles.promoButtonText}>{t('seeOffers')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.promoCard, styles.rewardsCard]}>
            <View style={styles.rewardsIcon}>
              <Ionicons color="#FFFFFF" name="gift-outline" size={22} />
            </View>
            <Text style={styles.rewardsTitle}>{t('rewards')}</Text>
            <Text style={styles.rewardsSubtitle}>{t('rewardsInfo')}</Text>
            <Pressable onPress={() => showComingSoon(t('discoverBenefits'))} style={({ pressed }) => [styles.rewardsButton, pressed && styles.pressed]}>
              <Text style={styles.rewardsButtonText}>{t('discoverBenefits')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      )}

      <Pressable accessibilityLabel="WhatsApp" onPress={openWhatsApp} style={({ pressed }) => [styles.whatsapp, pressed && styles.pressed]}>
        <Ionicons color="#FFFFFF" name="logo-whatsapp" size={36} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  resultsScreen: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  resultsContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 28,
  },
  resultsLocationLabel: {
    color: '#777777',
    fontSize: 13,
  },
  resultsLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 7,
  },
  resultsLocationText: {
    flex: 1,
    color: '#242424',
    fontSize: 15,
    fontWeight: '700',
  },
  resultsDemoText: {
    marginTop: 12,
    marginBottom: 16,
    color: '#8A8A8A',
    fontSize: 11,
    lineHeight: 15,
  },
  resultsStatus: {
    paddingVertical: 34,
    color: '#777777',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  carImage: {
    width: 118,
    minHeight: 132,
  },
  carCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 132,
    marginBottom: 13,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },
  carImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 118,
    backgroundColor: '#EAF8F3',
  },
  carCardContent: {
    flex: 1,
    padding: 14,
  },
  carName: {
    color: '#202020',
    fontSize: 16,
    fontWeight: '800',
  },
  carCategory: {
    marginTop: 3,
    color: '#777777',
    fontSize: 12,
  },
  carMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  carDistance: {
    color: '#777777',
    fontSize: 12,
  },
  carPrice: {
    marginTop: 8,
    color: '#08735D',
    fontSize: 16,
    fontWeight: '900',
  },
  carPriceUnit: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '500',
  },
  content: {
    paddingBottom: 42,
  },
  hero: {
    height: 330,
    overflow: 'hidden',
    backgroundColor: '#071710',
  },
  heroShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 20, 12, 0.68)',
  },
  heroSafeArea: {
    flex: 1,
    paddingHorizontal: 22,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -1.6,
  },
  logoTagline: {
    color: '#FFCC2D',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  languageBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageFlag: {
    fontSize: 22,
  },
  greeting: {
    marginTop: 42,
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },
  searchCard: {
    width: '92%',
    alignSelf: 'center',
    marginTop: -52,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 6,
  },
  searchTitle: {
    color: '#242424',
    fontSize: 17,
    fontWeight: '800',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    marginTop: 18,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    gap: 10,
  },
  searchTextInput: {
    flex: 1,
    height: '100%',
    color: '#222222',
    fontSize: 15,
  },
  locationError: {
    marginTop: 9,
    color: '#B44242',
    fontSize: 12,
    lineHeight: 16,
  },
  suggestions: {
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    gap: 10,
  },
  suggestionPressed: {
    backgroundColor: '#F0FAF6',
  },
  suggestionText: {
    flex: 1,
    color: '#383838',
    fontSize: 13,
    lineHeight: 18,
  },
  attribution: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: '#8B8B8B',
    fontSize: 10,
    textAlign: 'right',
  },
  searchButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    marginTop: 16,
    borderRadius: 9,
    backgroundColor: '#08735D',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  promotions: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 34,
  },
  promoCard: {
    height: 206,
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: '#111111',
  },
  promoShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.43)',
  },
  promoContent: {
    width: '74%',
    padding: 20,
  },
  promoEyebrow: {
    color: '#FFCC2D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  promoTitle: {
    marginTop: 7,
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 25,
  },
  promoSubtitle: {
    marginTop: 7,
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 17,
  },
  promoButton: {
    alignSelf: 'flex-start',
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#08735D',
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  rewardsCard: {
    padding: 20,
    backgroundColor: '#FFB51B',
  },
  rewardsIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#08735D',
  },
  rewardsTitle: {
    width: '82%',
    marginTop: 12,
    color: '#18372E',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  rewardsSubtitle: {
    width: '82%',
    marginTop: 7,
    color: '#313131',
    fontSize: 12,
    lineHeight: 17,
  },
  rewardsButton: {
    alignSelf: 'flex-start',
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#08735D',
  },
  rewardsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  whatsapp: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 62,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    borderRadius: 31,
    backgroundColor: '#22C765',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 5,
  },
  menuScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 66,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  menuHeaderTitle: {
    color: '#202020',
    fontSize: 16,
    fontWeight: '800',
  },
  settingsHeaderTitle: {
    color: '#202020',
    fontSize: 18,
    fontWeight: '800',
  },
  menuHeaderSpacer: {
    width: 30,
  },
  menuProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 122,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
    gap: 16,
  },
  menuAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FDB01B',
  },
  menuAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  menuProfileGreeting: {
    flex: 1,
    color: '#111111',
    fontSize: 25,
    fontWeight: '900',
  },
  menuCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DDDDDD',
  },
  menuContent: {
    paddingBottom: 86,
  },
  menuSectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 24,
    color: '#858585',
    fontSize: 15,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 24,
  },
  menuItemLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currencyBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#D6D6D6',
    borderRadius: 10,
    gap: 7,
  },
  currencyText: {
    color: '#222222',
    fontSize: 14,
    fontWeight: '700',
  },
  currencyFlag: {
    fontSize: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 57,
    paddingHorizontal: 34,
    gap: 18,
  },
  menuRowPressed: {
    backgroundColor: '#F3F3F3',
  },
  menuItemText: {
    flex: 1,
    color: '#171717',
    fontSize: 16,
    fontWeight: '500',
  },
  followSection: {
    marginTop: 24,
    paddingHorizontal: 38,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  followTitle: {
    color: '#262626',
    fontSize: 16,
    fontWeight: '500',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 22,
  },
  settingsContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  settingsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 126,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D8D8',
  },
  settingsLabel: {
    color: '#646464',
    fontSize: 15,
  },
  settingsValue: {
    marginTop: 14,
    color: '#242424',
    fontSize: 15,
    fontWeight: '800',
  },
  settingsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 68,
    paddingRight: 2,
  },
  settingsToggleText: {
    width: '76%',
    paddingRight: 16,
    color: '#5C5C5C',
    fontSize: 15,
    lineHeight: 18,
  },
  settingsSwitch: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 42,
  },
  languageSelectionContent: {
    paddingTop: 12,
    paddingBottom: 96,
  },
  languageSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 66,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E4',
    gap: 14,
  },
  languageSelectionFlag: {
    fontSize: 22,
  },
  languageSelectionText: {
    flex: 1,
    color: '#252525',
    fontSize: 16,
    fontWeight: '500',
  },
  saveLanguageButton: {
    position: 'absolute',
    right: 22,
    bottom: 18,
    left: 22,
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFB21C',
  },
  saveLanguageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
  publishContent: {
    padding: 20,
    gap: 14,
  },
  publishLabel: {
    marginBottom: 6,
    color: '#575757',
    fontSize: 13,
    fontWeight: '600',
  },
  publishInput: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    color: '#242424',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  publishLocation: {
    color: '#08735D',
    fontSize: 12,
    lineHeight: 17,
  },
  publishFeedback: {
    color: '#08735D',
    fontSize: 12,
    lineHeight: 17,
  },
});

function SearchResultsScreen({ coordinates, destination, onBack, t }: { coordinates: Coordinates; destination: string; onBack: () => void; t: (key: string) => string }) {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCars() {
      try {
        const params = new URLSearchParams({
          lat: String(coordinates.latitude),
          lon: String(coordinates.longitude),
          radiusKm: '50',
        });
        const response = await fetch(`${apiUrl}/cars?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Car search failed');
        }

        const data = (await response.json()) as { cars: CarListing[] };
        if (isMounted) {
          setCars(data.cars);
        }
      } catch {
        if (isMounted) {
          setLoadFailed(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCars();
    return () => {
      isMounted = false;
    };
  }, [coordinates.latitude, coordinates.longitude]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.resultsScreen}>
      <View style={styles.menuHeader}>
        <Pressable accessibilityLabel="Voltar" onPress={onBack}>
          <Ionicons color="#242424" name="arrow-back" size={30} />
        </Pressable>
        <Text style={styles.settingsHeaderTitle}>{t('availableCars')}</Text>
        <View style={styles.menuHeaderSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.resultsContent}>
        <Text style={styles.resultsLocationLabel}>{t('near')}</Text>
        <View style={styles.resultsLocation}>
          <Ionicons color="#08735D" name="location-outline" size={19} />
          <Text numberOfLines={2} style={styles.resultsLocationText}>{destination}</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator color="#08735D" size="large" style={styles.resultsStatus} />
        ) : loadFailed ? (
          <Text style={styles.resultsStatus}>{t('carsLoadFailed')}</Text>
        ) : cars.length === 0 ? (
          <Text style={styles.resultsStatus}>{t('noCarsNearby')}</Text>
        ) : cars.map((car) => (
          <View key={car.id} style={styles.carCard}>
            {car.imageUrl ? (
              <Image contentFit="cover" source={{ uri: car.imageUrl }} style={styles.carImage} />
            ) : (
              <View style={styles.carImagePlaceholder}>
                <Ionicons color="#08735D" name="car-outline" size={52} />
              </View>
            )}
            <View style={styles.carCardContent}>
              <Text style={styles.carName}>{car.title}</Text>
              <Text style={styles.carCategory}>{car.category}</Text>
              <View style={styles.carMetaRow}>
                <Ionicons color="#777777" name="location-outline" size={14} />
                <Text style={styles.carDistance}>{formatDistance(car.distanceKm)}</Text>
              </View>
              <Text style={styles.carPrice}>{formatPrice(car.dailyPrice, car.currency)} <Text style={styles.carPriceUnit}>{t('perDay')}</Text></Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

type ClientMenuProps = {
  clientName: string;
  greetingText: string;
  languageCode: (typeof languages)[number]['code'];
  onBack: () => void;
  setLanguageCode: (code: (typeof languages)[number]['code']) => void;
  t: (key: string) => string;
};

function ClientMenu({ clientName, greetingText, languageCode, onBack, setLanguageCode, t }: ClientMenuProps) {
  const [isSettingsScreenOpen, setIsSettingsScreenOpen] = useState(false);
  const [isLanguageScreenOpen, setIsLanguageScreenOpen] = useState(false);
  const [isCurrencyScreenOpen, setIsCurrencyScreenOpen] = useState(false);
  const [isPublishScreenOpen, setIsPublishScreenOpen] = useState(false);
  const [pendingLanguageCode, setPendingLanguageCode] = useState(languageCode);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<(typeof currencies)[number]['code']>('BRL');
  const selectedCurrency =
    currencies.find((currency) => currency.code === selectedCurrencyCode) ?? currencies[0];

  function showMenuComingSoon(label: string) {
    Alert.alert('Em breve', `${label} ainda não está disponível no aplicativo.`);
  }

  function handleMenuAction(key: string) {
    if (key === 'home') {
      onBack();
      return;
    }

    if (key === 'publishCar') {
      setIsPublishScreenOpen(true);
      return;
    }

    if (key === 'settings') {
      setIsSettingsScreenOpen(true);
      return;
    }

    showMenuComingSoon(t(key));
  }

  function handleLogout() {
    onBack();
    router.replace('/');
  }

  if (isPublishScreenOpen) {
    return <PublishCarScreen onBack={() => setIsPublishScreenOpen(false)} t={t} />;
  }

  if (isLanguageScreenOpen) {
    return (
      <LanguageSelectionScreen
        languageCode={pendingLanguageCode}
        onBack={() => setIsLanguageScreenOpen(false)}
        onSave={() => {
          setLanguageCode(pendingLanguageCode);
          setIsLanguageScreenOpen(false);
        }}
        selectLanguage={setPendingLanguageCode}
        t={t}
      />
    );
  }

  if (isCurrencyScreenOpen) {
    return (
      <CurrencySelectionScreen
        currencyCode={selectedCurrencyCode}
        onBack={() => setIsCurrencyScreenOpen(false)}
        selectCurrency={(code) => {
          setSelectedCurrencyCode(code);
          setIsCurrencyScreenOpen(false);
        }}
        t={t}
      />
    );
  }

  if (isSettingsScreenOpen) {
    return (
      <SettingsScreen
        languageCode={languageCode}
        onBack={() => setIsSettingsScreenOpen(false)}
        onOpenCurrency={() => setIsCurrencyScreenOpen(true)}
        onOpenLanguage={() => setIsLanguageScreenOpen(true)}
        selectedCurrency={selectedCurrency}
        t={t}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.menuScreen}>
      <View style={styles.menuProfileHeader}>
        <View style={styles.menuAvatar}>
          <Text style={styles.menuAvatarText}>{(clientName || 'GC').slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text numberOfLines={1} style={styles.menuProfileGreeting}>{greetingText}</Text>
        <Pressable accessibilityLabel="Fechar menu" onPress={onBack} style={styles.menuCloseButton}>
          <Ionicons color="#777777" name="close" size={29} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.menuContent}>
        <Text style={styles.menuSectionTitle}>{t('preferences')}</Text>
        <Pressable onPress={() => setIsSettingsScreenOpen(true)} style={styles.preferenceRow}>
          <View style={styles.menuItemLabel}>
            <Ionicons color="#5F5F5F" name="chatbox-outline" size={27} />
            <Text style={styles.menuItemText}>{t('languageCurrency')}</Text>
          </View>
          <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>{selectedCurrency.symbol}</Text>
              <Text style={styles.currencyFlag}>{selectedCurrency.flag}</Text>
          </View>
        </Pressable>

        <Text style={styles.menuSectionTitle}>{t('forYou')}</Text>
        {personalMenuItems.map((item) => (
          <MenuRow
            icon={item.icon}
            key={item.key}
            label={t(item.key)}
            onPress={() => handleMenuAction(item.key)}
          />
        ))}

        <Text style={styles.menuSectionTitle}>Ghostcar</Text>
        {supportMenuItems.map((item) => (
          <MenuRow icon={item.icon} key={item.key} label={t(item.key)} onPress={() => showMenuComingSoon(t(item.key))} />
        ))}

        <View style={styles.followSection}>
          <Text style={styles.followTitle}>{t('followUs')}</Text>
          <View style={styles.socialIcons}>
            <Ionicons color="#777777" name="logo-facebook" size={26} />
            <Ionicons color="#777777" name="logo-instagram" size={27} />
            <Ionicons color="#777777" name="logo-linkedin" size={26} />
          </View>
        </View>

        <MenuRow icon="log-out-outline" label={t('logout')} onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PublishCarScreen({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
  const [ownerName, setOwnerName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [dailyPrice, setDailyPrice] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [city, setCity] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function locateCar() {
    setIsLocating(true);
    setFeedback('');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setFeedback(t('locationDenied'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordinates(position.coords);
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      setCity([address?.city, address?.region].filter(Boolean).join(', '));
    } catch {
      setFeedback(t('locationFailed'));
    } finally {
      setIsLocating(false);
    }
  }

  async function publishCar() {
    if (!ownerName.trim() || !title.trim() || !category.trim() || !dailyPrice.trim() || !coordinates) {
      setFeedback(t('completeCarForm'));
      return;
    }

    setIsSubmitting(true);
    setFeedback('');
    try {
      const response = await fetch(`${apiUrl}/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName,
          title,
          category,
          dailyPrice,
          currency: 'BRL',
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          city,
        }),
      });
      if (!response.ok) {
        throw new Error('Car publication failed');
      }

      setFeedback(t('carPublished'));
      setOwnerName('');
      setTitle('');
      setCategory('');
      setDailyPrice('');
    } catch {
      setFeedback(t('carPublishFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.menuScreen}>
      <View style={styles.menuHeader}>
        <Pressable accessibilityLabel="Voltar" onPress={onBack}>
          <Ionicons color="#242424" name="arrow-back" size={30} />
        </Pressable>
        <Text style={styles.settingsHeaderTitle}>{t('publishCar')}</Text>
        <View style={styles.menuHeaderSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.publishContent}>
        <Field label={t('ownerName')} onChangeText={setOwnerName} value={ownerName} />
        <Field label={t('carModel')} onChangeText={setTitle} value={title} />
        <Field label={t('carCategory')} onChangeText={setCategory} value={category} />
        <Field keyboardType="decimal-pad" label={t('dailyPrice')} onChangeText={setDailyPrice} value={dailyPrice} />
        <Pressable onPress={locateCar} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
          {isLocating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.searchButtonText}>{t('useCurrentLocation')}</Text>}
        </Pressable>
        {!!coordinates && <Text style={styles.publishLocation}>{city || `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`}</Text>}
        {!!feedback && <Text style={styles.publishFeedback}>{feedback}</Text>}
        <Pressable disabled={isSubmitting} onPress={publishCar} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
          {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.searchButtonText}>{t('publish')}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ keyboardType, label, onChangeText, value }: { keyboardType?: 'decimal-pad'; label: string; onChangeText: (value: string) => void; value: string }) {
  return (
    <View>
      <Text style={styles.publishLabel}>{label}</Text>
      <TextInput keyboardType={keyboardType} onChangeText={onChangeText} style={styles.publishInput} value={value} />
    </View>
  );
}

type SettingsScreenProps = {
  languageCode: (typeof languages)[number]['code'];
  onBack: () => void;
  onOpenCurrency: () => void;
  onOpenLanguage: () => void;
  selectedCurrency: (typeof currencies)[number];
  t: (key: string) => string;
};

function SettingsScreen({ languageCode, onBack, onOpenCurrency, onOpenLanguage, selectedCurrency, t }: SettingsScreenProps) {
  const [allowPush, setAllowPush] = useState(false);
  const [allowLocation, setAllowLocation] = useState(false);
  const language = languages.find((item) => item.code === languageCode) ?? languages[0];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.menuScreen}>
      <View style={styles.menuHeader}>
        <Pressable accessibilityLabel="Voltar" onPress={onBack}>
          <Ionicons color="#242424" name="arrow-back" size={30} />
        </Pressable>
        <Text style={styles.settingsHeaderTitle}>{t('settings')}</Text>
        <Ionicons color="#242424" name="menu" size={31} />
      </View>

      <View style={styles.settingsContent}>
        <Pressable onPress={onOpenLanguage} style={styles.settingsLinkRow}>
          <View>
            <Text style={styles.settingsLabel}>{t('language')}</Text>
            <Text style={styles.settingsValue}>{language.label}</Text>
          </View>
          <Ionicons color="#242424" name="chevron-forward" size={28} />
        </Pressable>

        <Pressable onPress={onOpenCurrency} style={styles.settingsLinkRow}>
          <View>
            <Text style={styles.settingsLabel}>{t('currency')}</Text>
            <Text style={styles.settingsValue}>
              {selectedCurrency.label} ({selectedCurrency.symbol})
            </Text>
          </View>
          <Ionicons color="#242424" name="chevron-forward" size={28} />
        </Pressable>

        <View style={styles.settingsToggleRow}>
          <Text style={styles.settingsToggleText}>{t('allowPush')}</Text>
          <View style={styles.settingsSwitch}>
            <Switch
              onValueChange={setAllowPush}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#CECECE', true: '#08735D' }}
              value={allowPush}
            />
          </View>
        </View>

        <View style={styles.settingsToggleRow}>
          <Text style={styles.settingsToggleText}>{t('allowLocation')}</Text>
          <View style={styles.settingsSwitch}>
            <Switch
              onValueChange={setAllowLocation}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#CECECE', true: '#08735D' }}
              value={allowLocation}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

type CurrencySelectionScreenProps = {
  currencyCode: (typeof currencies)[number]['code'];
  onBack: () => void;
  selectCurrency: (code: (typeof currencies)[number]['code']) => void;
  t: (key: string) => string;
};

function CurrencySelectionScreen({ currencyCode, onBack, selectCurrency, t }: CurrencySelectionScreenProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.menuScreen}>
      <View style={styles.menuHeader}>
        <Pressable accessibilityLabel="Voltar" onPress={onBack}>
          <Ionicons color="#242424" name="arrow-back" size={30} />
        </Pressable>
        <Text style={styles.menuHeaderTitle}>{t('selectCurrency')}</Text>
        <View style={styles.menuHeaderSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.languageSelectionContent}>
        {currencies.map((currency) => (
          <Pressable
            key={currency.code}
            onPress={() => selectCurrency(currency.code)}
            style={({ pressed }) => [
              styles.languageSelectionRow,
              pressed && styles.menuRowPressed,
            ]}>
            <Text style={styles.languageSelectionFlag}>{currency.flag}</Text>
            <Text style={styles.languageSelectionText}>
              {currency.label} ({currency.symbol})
            </Text>
            <Ionicons
              color={currency.code === currencyCode ? '#08735D' : '#C7C7C7'}
              name={currency.code === currencyCode ? 'radio-button-on' : 'radio-button-off'}
              size={24}
            />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

type LanguageSelectionScreenProps = {
  languageCode: (typeof languages)[number]['code'];
  onBack: () => void;
  onSave: () => void;
  selectLanguage: (code: (typeof languages)[number]['code']) => void;
  t: (key: string) => string;
};

function LanguageSelectionScreen({
  languageCode,
  onBack,
  onSave,
  selectLanguage,
  t,
}: LanguageSelectionScreenProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.menuScreen}>
      <View style={styles.menuHeader}>
        <Pressable accessibilityLabel="Voltar" onPress={onBack}>
          <Ionicons color="#242424" name="arrow-back" size={30} />
        </Pressable>
        <Text style={styles.menuHeaderTitle}>{t('language')}</Text>
        <View style={styles.menuHeaderSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.languageSelectionContent}>
        {languages.map((language) => (
          <Pressable
            key={language.code}
            onPress={() => selectLanguage(language.code)}
            style={({ pressed }) => [
              styles.languageSelectionRow,
              pressed && styles.menuRowPressed,
            ]}>
            <Text style={styles.languageSelectionFlag}>{language.flag}</Text>
            <Text style={styles.languageSelectionText}>{language.label}</Text>
            <Ionicons
              color={language.code === languageCode ? '#08735D' : '#C7C7C7'}
              name={language.code === languageCode ? 'radio-button-on' : 'radio-button-off'}
              size={24}
            />
          </Pressable>
        ))}
      </ScrollView>

      <Pressable onPress={onSave} style={({ pressed }) => [styles.saveLanguageButton, pressed && styles.pressed]}>
        <Text style={styles.saveLanguageButtonText}>{t('save')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function MenuRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
      <Ionicons color="#5F5F5F" name={icon} size={27} />
      <Text style={styles.menuItemText}>{label}</Text>
    </Pressable>
  );
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

function formatDistance(distanceKm: number | null) {
  return distanceKm == null ? '' : `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { currency, style: 'currency' }).format(price);
}
