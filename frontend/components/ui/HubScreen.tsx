/**
 * Shared chrome for all non-gameplay screens: navy background, static star
 * dots, safe-area padding, coin balance pinned top (spec §5.2), optional
 * back button + title row.
 */
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hub, Spacing } from '@/constants/theme';
import { CoinBalance } from './CoinBalance';
import { PixelText } from './PixelText';
import { StarField } from './StarField';

interface Props {
  title?: string;
  showBack?: boolean;
  showCoins?: boolean;
  scroll?: boolean;
  starSeed?: number;
  children: React.ReactNode;
}

export function HubScreen({
  title,
  showBack = true,
  showCoins = true,
  scroll = false,
  starSeed = 3,
  children,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const header = (
    <>
      {showCoins && <CoinBalance />}
      {(title || showBack) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Spacing.md,
            marginTop: Spacing.sm,
            marginBottom: Spacing.lg,
          }}
        >
          {showBack && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{ marginRight: Spacing.md }}
            >
              <PixelText size={14} color={Hub.yellow}>
                {'<'}
              </PixelText>
            </Pressable>
          )}
          {title && (
            <PixelText size={14} color={Hub.white}>
              {title}
            </PixelText>
          )}
        </View>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Hub.background, paddingTop: insets.top + 8 }}>
      <StarField seed={starSeed} />
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: Spacing.md, paddingBottom: insets.bottom + Spacing.md }}>
          {children}
        </View>
      )}
    </View>
  );
}
