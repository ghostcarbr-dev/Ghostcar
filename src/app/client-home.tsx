import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientHomeScreen() {
  const [destination, setDestination] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  async function useCurrentLocation() {
    setIsLocating(true);
    setLocationError('');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationError('Permita o acesso à localização para usar sua posição atual.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [address] = await Location.reverseGeocodeAsync(currentLocation.coords);

      if (!address) {
        setDestination(
          `${currentLocation.coords.latitude.toFixed(5)}, ${currentLocation.coords.longitude.toFixed(5)}`
        );
        return;
      }

      setDestination(
        [address.street, address.name, address.city, address.region].filter(Boolean).join(', ')
      );
    } catch {
      setLocationError('Não foi possível obter sua localização. Tente novamente.');
    } finally {
      setIsLocating(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
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
                <Text style={styles.logoTagline}>ALUGUEL DE CARROS</Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable accessibilityLabel="Notificações">
                  <Ionicons color="#FFFFFF" name="notifications-outline" size={24} />
                </Pressable>
                <View style={styles.languageBadge}>
                  <Text style={styles.languageText}>BR</Text>
                </View>
                <Pressable accessibilityLabel="Menu">
                  <Ionicons color="#FFFFFF" name="menu" size={31} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.greeting}>Olá!</Text>
          </SafeAreaView>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Qual é o seu próximo destino?</Text>
          <View style={styles.searchInput}>
            <Pressable accessibilityLabel="Usar minha localização atual" onPress={useCurrentLocation}>
              {isLocating ? (
                <ActivityIndicator color="#08735D" size="small" />
              ) : (
                <Ionicons color="#08735D" name="locate" size={24} />
              )}
            </Pressable>
            <TextInput
              placeholder="Buscar destinos"
              placeholderTextColor="#B0B0B0"
              value={destination}
              onChangeText={setDestination}
              style={styles.searchTextInput}
            />
          </View>
          {!!locationError && <Text style={styles.locationError}>{locationError}</Text>}
          <Pressable style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
            <Text style={styles.searchButtonText}>Buscar</Text>
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
              <Text style={styles.promoEyebrow}>PLANEJE SUA VIAGEM</Text>
              <Text style={styles.promoTitle}>Seu próximo caminho começa aqui.</Text>
              <Text style={styles.promoSubtitle}>Encontre o carro ideal para aproveitar cada momento.</Text>
              <Pressable style={({ pressed }) => [styles.promoButton, pressed && styles.pressed]}>
                <Text style={styles.promoButtonText}>VER OFERTAS</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.promoCard, styles.rewardsCard]}>
            <View style={styles.rewardsIcon}>
              <Ionicons color="#FFFFFF" name="gift-outline" size={22} />
            </View>
            <Text style={styles.rewardsTitle}>Quanto mais você viaja, mais vantagens ganha.</Text>
            <Text style={styles.rewardsSubtitle}>
              Reserve com a Ghostcar e acompanhe benefícios exclusivos.
            </Text>
            <Pressable style={({ pressed }) => [styles.rewardsButton, pressed && styles.pressed]}>
              <Text style={styles.rewardsButtonText}>CONHECER BENEFÍCIOS</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFCC2D',
  },
  languageText: {
    color: '#172419',
    fontSize: 12,
    fontWeight: '900',
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
  pressed: {
    opacity: 0.78,
  },
});
