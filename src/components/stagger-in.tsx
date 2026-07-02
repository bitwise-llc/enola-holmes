import { Children, isValidElement } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Wraps a group of elements so each child fades+slides in one after another
// instead of all popping at once. Drop-in replacement for the content <View>.
// ponytail: fixed 90ms stagger / 450ms duration — tune here if a screen needs it.
type Props = ViewProps & { delay?: number; step?: number };

export function StaggerIn({ children, delay = 100, step = 90, style, ...rest }: Props) {
  return (
    <View style={style} {...rest}>
      {Children.toArray(children).map((child, i) =>
        isValidElement(child) ? (
          <Animated.View key={i} entering={FadeInDown.delay(delay + i * step).duration(450)}>
            {child}
          </Animated.View>
        ) : (
          child
        )
      )}
    </View>
  );
}
