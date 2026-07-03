/**
 * Shared chart chrome: pixel panel, title, entrance animation, width
 * measurement. Children receive the measured plot width.
 */
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Hub } from '@/constants/theme';
import { PixelText } from '@/components/ui/PixelText';

interface Props {
  title: string;
  accent: string;
  /** Entrance stagger order. */
  index?: number;
  children: (width: number) => React.ReactNode;
}

export const CHART_HEIGHT = 150;

export function ChartFrame({ title, accent, index = 0, children }: Props) {
  const [width, setWidth] = useState(0);
  return (
    <Animated.View
      entering={FadeInDown.delay(120 * index).duration(400)}
      style={{
        backgroundColor: Hub.panel,
        borderBottomWidth: 4,
        borderBottomColor: Hub.panelBevel,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 8, height: 8, backgroundColor: accent }} />
        <PixelText size={9} color={Hub.white}>
          {title}
        </PixelText>
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? children(width) : null}
      </View>
    </Animated.View>
  );
}
