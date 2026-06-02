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
      <View style={styles.webAnnouncement}>
        <Text style={styles.webAnnouncementText}>Offre de lancement Ghostcar : publiez votre première voiture gratuitement.</Text>
        <Text style={styles.webAnnouncementLink}>En savoir plus</Text>
      </View>

      <View style={styles.webHeader}>
        <View>
          <Text style={styles.webLogo}>Ghostcar</Text>
          <Text style={styles.webLogoTagline}>ALUGUEL DE CARROS</Text>
        </View>
        <View style={styles.webNav}>
          <Text style={styles.webNavLink}>Louer une voiture</Text>
          <Text style={styles.webNavLink}>Louer ma voiture</Text>
          <Text style={styles.webNavLink}>Aide</Text>
          <Pressable onPress={() => router.push('/client-home')} style={styles.webLoginButton}>
            <Ionicons color="#08735D" name="person-outline" size={18} />
            <Text style={styles.webLoginText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.webHero}>
        <View style={[styles.webSection, styles.webHeroGrid]}>
          <View style={styles.webHeroCopy}>
            <Text style={styles.webHeroTitle}>Louez une voiture en quelques clics</Text>
            <Text style={styles.webHeroSubtitle}>
              Trouvez un véhicule proche de vous, réservez simplement et partez quand vous voulez.
            </Text>
          </View>
          <View style={styles.webSearchCard}>
            <Text style={styles.webSearchTitle}>Indiquez un lieu précis</Text>
            <View style={styles.webDestinationInput}>
              <Ionicons color="#00102D" name="location-outline" size={21} />
              <TextInput
                onChangeText={setDestination}
                placeholder="Adresse, gare, aéroport, métro..."
                placeholderTextColor="#8C9693"
                style={styles.webDestinationText}
                value={destination}
              />
            </View>
            <View style={styles.webDateGrid}>
              <View style={styles.webDateBox}>
                <Text style={styles.webDateLabel}>Début</Text>
                <Text style={styles.webDateValue}>Aujourd’hui</Text>
              </View>
              <View style={styles.webDateBox}>
                <Text style={styles.webDateLabel}>Fin</Text>
                <Text style={styles.webDateValue}>Demain</Text>
              </View>
            </View>
            <Pressable onPress={() => router.push('/client-home')} style={styles.webSearchButton}>
              <Text style={styles.webSearchButtonText}>Rechercher</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.webSection, styles.webTrustBar]}>
        <Text style={styles.webTrustTitle}>Location de voiture entre particuliers et professionnels</Text>
        <View style={styles.webRating}>
          <Ionicons color="#FFB21C" name="star" size={19} />
          <Text style={styles.webRatingText}>4.8/5 d’après les premiers utilisateurs Ghostcar</Text>
        </View>
      </View>

      <View style={[styles.webSection, styles.webIntroSection]}>
        <View style={styles.webIntroCopy}>
          <Text style={styles.webSectionTitle}>Voici la nouvelle manière de louer une voiture</Text>
          <Text style={styles.webSectionSubtitle}>
            Choisissez parmi des voitures disponibles près de chez vous. La recherche est rapide,
            les annonces sont lisibles et les véhicules sont localisés autour du lieu choisi.
          </Text>
        </View>
        <View style={styles.webIllustrationCard}>
          <View style={styles.webPhoneMock}>
            <View style={styles.webPhoneNotch} />
            <Ionicons color="#00102D" name="car-sport" size={56} />
            <Text style={styles.webPhoneTitle}>Ghostcar</Text>
            <Text style={styles.webPhoneText}>Réservez, publiez et gérez vos trajets.</Text>
          </View>
        </View>
      </View>

      <View style={styles.webSoftSection}>
        <View style={styles.webSection}>
          <View style={styles.webStepGrid}>
            <WebStep icon="cash-outline" title="Des prix par heure ou par jour" text="Comparez les véhicules autour de votre destination et choisissez le tarif qui correspond à votre besoin." />
            <WebStep icon="flash-outline" title="Pas d’agence, pas d’attente" text="Recherchez depuis le web ou l’application, puis accédez rapidement aux annonces disponibles." />
            <WebStep icon="phone-portrait-outline" title="Tout se passe dans l’application" text="Retrouvez la publication de voiture, la recherche et vos réservations dans un seul espace." />
          </View>
        </View>
      </View>

      <View style={[styles.webSection, styles.webCategoriesSection]}>
        <Text style={styles.webSectionTitle}>Des voitures adaptées à vos besoins</Text>
        <View style={styles.webChipGrid}>
          {['Citadine', 'Utilitaire', 'SUV', 'Familiale', 'Premium', 'Électrique'].map((item) => (
            <WebChip key={item} label={item} />
          ))}
        </View>
      </View>

      <View style={styles.webBlueCta}>
        <View style={[styles.webSection, styles.webCtaGrid]}>
          <View>
            <Text style={styles.webCtaTitle}>Rentabilisez votre voiture</Text>
            <Text style={styles.webCtaText}>
              Publiez votre véhicule sur Ghostcar et rendez-le visible auprès des personnes qui cherchent une voiture près de vous.
            </Text>
          </View>
          <Pressable onPress={() => router.push('/client-home')} style={styles.webCtaButton}>
            <Text style={styles.webCtaButtonText}>Louer ma voiture</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.webSection, styles.webCitiesSection]}>
        <Text style={styles.webSectionTitle}>Disponible dans vos destinations clés</Text>
        <View style={styles.webCityGrid}>
          {['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Toulouse', 'Lille', 'Strasbourg', 'Nantes', 'Montpellier', 'Bruxelles', 'Genève'].map((city) => (
            <Text key={city} style={styles.webCityLink}>Location voiture {city}</Text>
          ))}
        </View>
      </View>

      <View style={styles.webFooter}>
        <View style={[styles.webSection, styles.webFooterGrid]}>
          <View>
            <Text style={styles.webFooterLogo}>Ghostcar</Text>
            <Text style={styles.webFooterText}>Une plateforme simple pour louer, publier et trouver une voiture près de vous.</Text>
          </View>
          <View>
            <Text style={styles.webFooterTitle}>Ghostcar</Text>
            <Text style={styles.webFooterText}>Louer une voiture</Text>
            <Text style={styles.webFooterText}>Louer ma voiture</Text>
            <Text style={styles.webFooterText}>Comment ça marche</Text>
          </View>
          <View>
            <Text style={styles.webFooterTitle}>Suporte</Text>
            <Text style={styles.webFooterText}>Centre d’aide</Text>
            <Text style={styles.webFooterText}>Politique de confidentialité</Text>
            <Text style={styles.webFooterText}>Conditions générales</Text>
          </View>
        </View>
        <Text style={styles.webCopyright}>© 2026 Ghostcar. Tous droits réservés.</Text>
      </View>
    </View>
  );
}

function WebStep({ icon, text, title }: { icon: keyof typeof Ionicons.glyphMap; text: string; title: string }) {
  return (
    <View style={styles.webStepCard}>
      <View style={styles.webStepIcon}>
        <Ionicons color="#00102D" name={icon} size={30} />
      </View>
      <Text style={styles.webStepTitle}>{title}</Text>
      <Text style={styles.webStepText}>{text}</Text>
    </View>
  );
}

function WebChip({ label }: { label: string }) {
  return (
    <View style={styles.webChip}>
      <Ionicons color="#00102D" name="car-outline" size={18} />
      <Text style={styles.webChipText}>{label}</Text>
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
        color: '#08735D',
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
        borderColor: '#08735D',
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
        color: '#08735D',
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
    backgroundColor: '#08735D',
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
    color: '#08735D',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    borderWidth: 1.5,
    borderColor: '#08735D',
    borderRadius: 7,
    ...Platform.select({
      web: {
        height: 52,
      },
    }),
  },
  createButtonText: {
    color: '#08735D',
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
  webAnnouncement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 9,
    backgroundColor: '#EEF3FF',
  },
  webAnnouncementText: {
    color: '#00102D',
    fontSize: 13,
    fontWeight: '700',
  },
  webAnnouncementLink: {
    color: '#005BD3',
    fontSize: 13,
    fontWeight: '900',
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 26,
    paddingVertical: 16,
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
    color: '#2D3440',
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
    borderColor: '#D7DAE0',
    borderRadius: 7,
  },
  webLoginText: {
    color: '#00102D',
    fontSize: 14,
    fontWeight: '700',
  },
  webHero: {
    backgroundColor: '#00102D',
    paddingVertical: 66,
  },
  webHeroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 44,
  },
  webHeroCopy: {
    flex: 1,
  },
  webSection: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 26,
  },
  webHeroTitle: {
    maxWidth: 520,
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.4,
    lineHeight: 51,
  },
  webHeroSubtitle: {
    maxWidth: 470,
    marginTop: 14,
    color: '#DCE6FF',
    fontSize: 17,
    lineHeight: 25,
  },
  webSearchCard: {
    width: 440,
    marginLeft: 'auto',
    padding: 22,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  webSearchTitle: {
    marginBottom: 14,
    color: '#101828',
    fontSize: 17,
    fontWeight: '900',
  },
  webDateGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  webDateBox: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D9DEE7',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  webDateLabel: {
    color: '#7B8491',
    fontSize: 11,
    fontWeight: '700',
  },
  webDateValue: {
    marginTop: 4,
    color: '#101828',
    fontSize: 14,
    fontWeight: '900',
  },
  webSearchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  webDestinationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 56,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D9DEE7',
    borderRadius: 8,
  },
  webDestinationText: {
    flex: 1,
    height: '100%',
    color: '#263532',
    fontSize: 14,
  },
  webSearchButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginTop: 14,
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
  webTrustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    paddingVertical: 28,
  },
  webTrustTitle: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '900',
  },
  webRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webRatingText: {
    color: '#46505C',
    fontSize: 13,
    fontWeight: '700',
  },
  webIntroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
    paddingVertical: 72,
  },
  webIntroCopy: {
    flex: 1,
  },
  webIllustrationCard: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 360,
    borderRadius: 28,
    backgroundColor: '#E9F0FF',
  },
  webPhoneMock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 320,
    borderWidth: 10,
    borderColor: '#00102D',
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
  },
  webPhoneNotch: {
    position: 'absolute',
    top: 13,
    width: 62,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00102D',
  },
  webPhoneTitle: {
    marginTop: 16,
    color: '#00102D',
    fontSize: 24,
    fontWeight: '900',
  },
  webPhoneText: {
    maxWidth: 150,
    marginTop: 8,
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  webStepGrid: {
    flexDirection: 'row',
    gap: 18,
  },
  webStepCard: {
    flex: 1,
    minHeight: 230,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E6EF',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  webStepIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E9F0FF',
  },
  webStepTitle: {
    marginTop: 20,
    color: '#101828',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  webStepText: {
    marginTop: 10,
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
  },
  webCategoriesSection: {
    paddingVertical: 68,
  },
  webChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 26,
  },
  webChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DDE3EE',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  webChipText: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '800',
  },
  webBlueCta: {
    paddingVertical: 52,
    backgroundColor: '#00102D',
  },
  webCtaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 30,
  },
  webCtaTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  webCtaText: {
    maxWidth: 650,
    marginTop: 9,
    color: '#DCE6FF',
    fontSize: 15,
    lineHeight: 23,
  },
  webCtaButton: {
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 9,
    backgroundColor: '#FFB21C',
  },
  webCtaButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  webCitiesSection: {
    paddingVertical: 68,
  },
  webCityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  webCityLink: {
    width: '23%',
    color: '#005BD3',
    fontSize: 13,
    fontWeight: '700',
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
    paddingVertical: 66,
    backgroundColor: '#F6F7FB',
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
    color: '#101828',
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
    borderColor: '#08735D',
    borderRadius: 8,
  },
  webOutlineButtonText: {
    color: '#08735D',
    fontSize: 14,
    fontWeight: '800',
  },
  webPublishVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '38%',
    minHeight: 240,
    borderRadius: 18,
    backgroundColor: '#08735D',
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
