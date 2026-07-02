import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// One digit box in the referral-code input. When its character changes it "rolls" in
// like a mechanical counter wheel: the char slides in vertically + fades. `flipDown`
// alternates the roll direction per box (top→center vs bottom→center). When the char
// is cleared it dissolves out (fade + shrink), approximating a pixel-dissolve.
type Props = {
  char: string;
  active: boolean;
  flipDown: boolean; // true: rolls in from the top; false: from the bottom
  delay?: number; // stagger so a pasted code cascades box-to-box
  onRoll?: () => void; // fired when a NEW char rolls in (for haptics + sound)
  error?: boolean; // paint the border red when the entered code was rejected
};

const ROLL = 26; // px the char travels as it rolls in

export function CodeBox({ char, active, flipDown, delay = 0, onRoll, error }: Props) {
  const prev = useRef('');
  // progress: 0 = mid-roll (offset + transparent), 1 = settled (centered + opaque)
  const progress = useSharedValue(char ? 1 : 0);
  // dissolve: 1 = visible, 0 = dissolved away (used only when clearing)
  const dissolve = useSharedValue(char ? 1 : 0);
  // tick: drives the delayed roll-start callback (haptic + sound) without affecting layout
  const tick = useSharedValue(0);

  useEffect(() => {
    const had = prev.current;
    prev.current = char;

    if (char && char !== had) {
      // A new character landed — roll it in from flipDown ? top : bottom, after the
      // stagger delay so a pasted code cascades left-to-right. The tick fires as the
      // roll STARTS (right after the delay) so typing feedback isn't laggy.
      dissolve.value = 1;
      progress.value = 0;
      progress.value = withDelay(
        delay,
        withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })
      );
      // fire the tick at roll-start: a 1ms timing whose callback runs after `delay`
      tick.value = 0;
      tick.value = withDelay(
        delay,
        withTiming(1, { duration: 1 }, (finished) => {
          if (finished && onRoll) runOnJS(onRoll)();
        })
      );
    } else if (!char && had) {
      // Character erased — dissolve out.
      dissolve.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) });
    }
  }, [char]);

  const charStyle = useAnimatedStyle(() => {
    const dir = flipDown ? -1 : 1; // top vs bottom entry
    return {
      opacity: progress.value * dissolve.value,
      transform: [
        { translateY: (1 - progress.value) * ROLL * dir },
        // shrink slightly while dissolving for the "pixelated vanish" feel
        { scale: 0.6 + dissolve.value * 0.4 },
      ],
    };
  });

  return (
    <View style={[styles.box, active && styles.boxActive, char && styles.boxFilled, error && styles.boxError]}>
      <Animated.View style={charStyle}>
        <Text style={styles.boxChar}>{char}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxWidth: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // clip the char while it rolls in from outside the box
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  boxFilled: {
    borderColor: '#1C1C1E',
  },
  boxActive: {
    borderColor: '#1C1C1E',
    borderWidth: 2,
  },
  boxError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  boxChar: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
  },
});
