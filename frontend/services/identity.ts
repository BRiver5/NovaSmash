/**
 * Silent anonymous identity (spec §3): a UUID v4 generated on first launch,
 * persisted in AsyncStorage, and sent as X-Device-ID on every API call.
 * No login/registration UI anywhere in the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'novasmash.device_id';

let cached: string | null = null;

function uuidv4(): string {
  // RFC 4122 v4 via Math.random — adequate for an anonymous, non-security ID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = uuidv4();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  cached = id;
  return id;
}
