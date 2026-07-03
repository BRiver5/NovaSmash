import { StyleProp, Text, TextStyle } from 'react-native';

import { PIXEL_FONT } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  center?: boolean;
  numberOfLines?: number;
}

/** All app text runs through this so the bundled pixel font is universal. */
export function PixelText({ children, size = 10, color = '#FFFFFF', style, center, numberOfLines }: Props) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: PIXEL_FONT,
          fontSize: size,
          color,
          lineHeight: Math.round(size * 1.6),
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
