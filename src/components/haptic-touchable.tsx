import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';

// Drop-in for TouchableOpacity that fires a light impact on press.
// Swap the import in a screen and every button there gets haptics for free.
// ponytail: single light-impact style covers 95% of taps; pass a heavier
// Haptics.impactAsync in the handler itself for destructive/confirm actions.
export function HapticTouchable({ onPress, ...props }: TouchableOpacityProps) {
  return (
    <TouchableOpacity
      {...props}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
    />
  );
}
