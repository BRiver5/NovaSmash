/**
 * Space Coins balance pill — pinned at the top of every non-gameplay screen
 * (spec §5.2). Reads live from the player store.
 */
import { View } from 'react-native';

import { Hub } from '@/constants/theme';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { PixelText } from './PixelText';

export function CoinBalance() {
  const coins = usePlayerStore((s) => s.player?.spaceCoins ?? 0);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
      }}
    >
      {/* pixel coin: yellow square with darker inner square */}
      <View style={{ width: 14, height: 14, backgroundColor: Hub.yellow, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 6, height: 6, backgroundColor: Hub.yellowBevel }} />
      </View>
      <PixelText size={11} color={Hub.white}>
        SPACE COINS {coins}
      </PixelText>
    </View>
  );
}
