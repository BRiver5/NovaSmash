/**
 * Chunky 3D pixel button (spec §2): solid face + darker bottom "lip" of
 * BUTTON_LIP px. On press the face squashes down (translateY +lip) and the
 * lip disappears — like a pressed arcade cabinet button.
 */
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BUTTON_LIP, Hub } from '@/constants/theme';
import { PixelText } from './PixelText';

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  bevelColor?: string;
  textColor?: string;
  disabled?: boolean;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
}

export function ChunkyButton({
  label,
  onPress,
  color = Hub.pink,
  bevelColor = Hub.pinkBevel,
  textColor = Hub.white,
  disabled = false,
  fontSize = 12,
  style,
}: Props) {
  const pressed = useSharedValue(0);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * BUTTON_LIP }],
  }));

  const face = disabled ? Hub.disabled : color;
  const lip = disabled ? Hub.disabledBevel : bevelColor;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 60 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 90 });
      }}
      style={[{ paddingBottom: BUTTON_LIP }, style]}
    >
      {/* lip layer sits behind/below the face */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: BUTTON_LIP,
          bottom: 0,
          backgroundColor: lip,
        }}
      />
      <Animated.View
        style={[
          {
            backgroundColor: face,
            paddingVertical: 14,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
          },
          faceStyle,
        ]}
      >
        <PixelText size={fontSize} color={disabled ? Hub.textDim : textColor} center>
          {label}
        </PixelText>
      </Animated.View>
    </Pressable>
  );
}
