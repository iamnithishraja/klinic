// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'house': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'stethoscope': 'medical-services',
  'cross.case': 'science',
  'person.circle': 'account-circle',
  'pills': 'medication',
  'pills.fill': 'medication',
  'medicine': 'medication',
  'medicine.fill': 'medication',
  'pharmacy': 'local-pharmacy',
  'pharmacy.fill': 'local-pharmacy',
  'medical.thermometer': 'thermostat',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'cross': 'add',
  'cross.fill': 'add',
  'plus': 'add',
  'minus': 'remove',
  'cart': 'shopping-cart',
  'cart.fill': 'shopping-cart',
  'magnifying-glass': 'search',
  'funnel': 'filter-list',
  'sliders-horizontal': 'tune',
  'x-mark': 'close',
  'x': 'close',
  'checkmark': 'check',
  'check': 'check',
  'check-circle': 'check-circle',
  'clock': 'schedule',
  'calendar': 'event',
  'location': 'location-on',
  'phone': 'phone',
  'envelope': 'email',
  'star': 'star',
  'star.fill': 'star',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'download': 'download',
  'upload': 'upload',
  'trash': 'delete',
  'edit': 'edit',
  'settings': 'settings',
  'notifications': 'notifications',
  'user': 'person',
  'users': 'people',
  'shield': 'security',
  'lock': 'lock',
  'unlock': 'lock-open',
  'key': 'vpn-key',
  'wifi': 'wifi',
  'battery': 'battery-full',
  'camera': 'camera-alt',
  'photo': 'photo',
  'video': 'videocam',
  'microphone': 'mic',
  'speaker': 'volume-up',
  'mute': 'volume-off',
  'play': 'play-arrow',
  'pause': 'pause',
  'stop': 'stop',
  'skip-backward': 'skip-previous',
  'skip-forward': 'skip-next',
  'shuffle': 'shuffle',
  'repeat': 'repeat',
  'volume': 'volume-up',
  'brightness': 'brightness-6',
  'moon': 'dark-mode',
  'sun': 'light-mode',
  'cloud': 'cloud',
  'cloud.rain': 'opacity',
  'cloud.snow': 'ac-unit',
  'wind': 'air',
  'thermometer': 'thermostat',
  'umbrella': 'beach-access',
  'leaf': 'eco',
  'flame': 'whatshot',
  'drop': 'water-drop',
  'bolt': 'flash-on',
  'snowflake': 'ac-unit',
  'tornado': 'air',
  'hurricane': 'air',
  'document': 'description',
  'document-text': 'description',
  'icon': 'info',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

IconSymbol.displayName = 'IconSymbol';
