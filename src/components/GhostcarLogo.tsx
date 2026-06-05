import { StyleSheet, Text, View } from 'react-native';

type GhostcarLogoProps = {
  align?: 'left' | 'center';
  color?: string;
  showTagline?: boolean;
  size?: 'small' | 'medium' | 'large' | 'hero';
  taglineColor?: string;
};

const logoSizes = {
  small: {
    titleFontSize: 22,
    titleLineHeight: 25,
    titleLetterSpacing: -2.8,
    taglineFontSize: 6,
    taglineLetterSpacing: -0.2,
  },
  medium: {
    titleFontSize: 34,
    titleLineHeight: 38,
    titleLetterSpacing: -4.6,
    taglineFontSize: 9,
    taglineLetterSpacing: -0.35,
  },
  large: {
    titleFontSize: 48,
    titleLineHeight: 52,
    titleLetterSpacing: -6.5,
    taglineFontSize: 11,
    taglineLetterSpacing: -0.45,
  },
  hero: {
    titleFontSize: 52,
    titleLineHeight: 58,
    titleLetterSpacing: -6,
    taglineFontSize: 11,
    taglineLetterSpacing: -0.35,
  },
} as const;

export function GhostcarLogo({
  align = 'left',
  color = '#FFFFFF',
  showTagline = true,
  size = 'medium',
  taglineColor,
}: GhostcarLogoProps) {
  const selectedSize = logoSizes[size];
  const textAlign = align === 'center' ? 'center' : 'left';

  return (
    <View style={[styles.container, size === 'hero' && styles.heroContainer, align === 'center' && styles.centered]}>
      <Text
        allowFontScaling={false}
        style={[
          styles.title,
          {
            color,
            fontSize: selectedSize.titleFontSize,
            letterSpacing: selectedSize.titleLetterSpacing,
            lineHeight: selectedSize.titleLineHeight,
            textAlign,
          },
        ]}>
        GHOSTCAR
      </Text>
      {showTagline && (
        <Text
          allowFontScaling={false}
          style={[
            styles.tagline,
            {
              color: taglineColor ?? color,
              fontSize: selectedSize.taglineFontSize,
              letterSpacing: selectedSize.taglineLetterSpacing,
              textAlign,
            },
          ]}>
          CARROS DE PESSOAS PARA PESSOAS
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  heroContainer: {
    paddingHorizontal: 10,
  },
  centered: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  title: {
    fontStyle: 'italic',
    fontWeight: '900',
    textTransform: 'uppercase',
    transform: [{ skewX: '-7deg' }],
  },
  tagline: {
    marginTop: -2,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
