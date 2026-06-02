import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  { icon: 'trophy-outline', key: 'rentRewards' },
  { icon: 'gift-outline', key: 'promotions' },
  { icon: 'settings-outline', key: 'settings' },
] as const;

const supportMenuItems = [
  { icon: 'help-circle-outline', key: 'helpCenter' },
  { icon: 'headset-outline', key: 'contactUs' },
  { icon: 'lock-closed-outline', key: 'privacyPolicy' },
  { icon: 'document-text-outline', key: 'terms' },
  { icon: 'information-circle-outline', key: 'about' },
] as const;

export default function ClientHomeScreen() {
  const [destination, setDestination] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { languageCode, setLanguageCode, t } = useLanguage();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const currentCoordinates = useRef<Coordinates | null>(null);
  const skipNextSuggestionFetch = useRef(false);
  const selectedLanguage =
    languages.find((language) => language.code === languageCode) ?? languages[0];

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

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {isMenuOpen ? (
        <ClientMenu
          flag={selectedLanguage.flag}
          onBack={() => setIsMenuOpen(false)}
          selectNextLanguage={selectNextLanguage}
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
                <Text style={styles.logo}>Ghostcar</Text>
                <Text style={styles.logoTagline}>{t('rentCars')}</Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable accessibilityLabel="Notificações">
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

            <Text style={styles.greeting}>{t('hello')}</Text>
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
          <Pressable style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
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
              <Pressable style={({ pressed }) => [styles.promoButton, pressed && styles.pressed]}>
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
            <Pressable style={({ pressed }) => [styles.rewardsButton, pressed && styles.pressed]}>
              <Text style={styles.rewardsButtonText}>{t('discoverBenefits')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      )}

      <Pressable accessibilityLabel="WhatsApp" style={({ pressed }) => [styles.whatsapp, pressed && styles.pressed]}>
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
    fontSize: 29,
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
    marginTop: 76,
    color: '#FFFFFF',
    fontSize: 32,
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
    fontSize: 20,
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
    fontSize: 17,
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
    fontSize: 14,
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
    fontSize: 20,
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
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 25,
  },
  promoSubtitle: {
    marginTop: 7,
    color: '#FFFFFF',
    fontSize: 13,
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
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 25,
  },
  rewardsSubtitle: {
    width: '82%',
    marginTop: 7,
    color: '#313131',
    fontSize: 13,
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
    fontSize: 18,
    fontWeight: '800',
  },
  menuContent: {
    paddingBottom: 86,
  },
  menuSectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 24,
    color: '#858585',
    fontSize: 17,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 24,
  },
  menuItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D6D6D6',
    borderRadius: 10,
    gap: 7,
  },
  currencyText: {
    color: '#222222',
    fontSize: 15,
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
    fontSize: 18,
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
    fontSize: 18,
    fontWeight: '500',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 22,
  },
  pressed: {
    opacity: 0.78,
  },
});

type ClientMenuProps = {
  flag: string;
  onBack: () => void;
  selectNextLanguage: () => void;
  t: (key: string) => string;
};

function ClientMenu({ flag, onBack, selectNextLanguage, t }: ClientMenuProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.menuScreen}>
      <View style={styles.menuHeader}>
        <Pressable accessibilityLabel="Voltar" onPress={onBack}>
          <Ionicons color="#242424" name="arrow-back" size={30} />
        </Pressable>
        <Text style={styles.menuHeaderTitle}>Menu</Text>
        <Ionicons color="#242424" name="menu" size={31} />
      </View>

      <ScrollView contentContainerStyle={styles.menuContent}>
        <Text style={styles.menuSectionTitle}>{t('preferences')}</Text>
        <Pressable onPress={selectNextLanguage} style={styles.preferenceRow}>
          <View style={styles.menuItemLabel}>
            <Ionicons color="#5F5F5F" name="chatbox-outline" size={27} />
            <Text style={styles.menuItemText}>{t('languageCurrency')}</Text>
          </View>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>US$</Text>
            <Text style={styles.currencyFlag}>{flag}</Text>
          </View>
        </Pressable>

        <Text style={styles.menuSectionTitle}>{t('forYou')}</Text>
        {personalMenuItems.map((item) => (
          <MenuRow icon={item.icon} key={item.key} label={t(item.key)} />
        ))}

        <Text style={styles.menuSectionTitle}>Ghostcar</Text>
        {supportMenuItems.map((item) => (
          <MenuRow icon={item.icon} key={item.key} label={t(item.key)} />
        ))}

        <View style={styles.followSection}>
          <Text style={styles.followTitle}>{t('followUs')}</Text>
          <View style={styles.socialIcons}>
            <Ionicons color="#777777" name="logo-facebook" size={26} />
            <Ionicons color="#777777" name="logo-instagram" size={27} />
            <Ionicons color="#777777" name="logo-linkedin" size={26} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
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
