import Svg, { Circle, Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';

// A clean, hand-free magnifying glass: lens + a FULL vertical handle, no fingers, so it
// stays crisp at any zoom and its handle can submerge straight into Enola's raised fist.
// Colours match her art: warm brass ring, cream lens, wooden handle.
//
// Geometry (viewBox 100x260):
//   lens center (50, 50), ring radius 40, lens radius 32
//   handle is VERTICAL on x=50, running y=88 -> y=250 (long, so it reaches deep into the
//   fist). index.tsx aligns x=50 to her grip column and sinks the handle bottom into her hand.
export function MagnifyingGlass({ size = 100 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 2.6} viewBox="0 0 100 260">
      <Defs>
        <LinearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E8CBA0" />
          <Stop offset="0.5" stopColor="#B88951" />
          <Stop offset="1" stopColor="#7A5A32" />
        </LinearGradient>
        <LinearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#B07C42" />
          <Stop offset="0.5" stopColor="#E0A868" />
          <Stop offset="1" stopColor="#8B5E30" />
        </LinearGradient>
        <LinearGradient id="lens" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FBF3E7" />
          <Stop offset="1" stopColor="#E3D2BC" />
        </LinearGradient>
      </Defs>

      {/* full vertical wooden handle — long enough to sink into her fist */}
      <Rect x="43" y="88" width="14" height="164" rx="7" fill="url(#wood)" />
      {/* brass collar joining ring to handle */}
      <Rect x="41" y="80" width="18" height="14" rx="4" fill="#8B5E30" />

      {/* brass ring */}
      <Circle cx="50" cy="50" r="40" fill="url(#brass)" />
      {/* glass lens */}
      <Circle cx="50" cy="50" r="32" fill="url(#lens)" />
      {/* highlight glints on the lens */}
      <Ellipse cx="39" cy="38" rx="13" ry="8" fill="#FFFFFF" opacity="0.85" transform="rotate(-25 39 38)" />
      <Ellipse cx="62" cy="60" rx="6" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-25 62 60)" />
    </Svg>
  );
}
