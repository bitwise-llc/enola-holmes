import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useDerivedValue, runOnJS } from 'react-native-reanimated';
import {
  Canvas,
  Fill,
  Circle,
  Group,
  Image as SkiaImage,
  Skia,
  ImageFormat,
  useImage as useSkiaImage,
} from '@shopify/react-native-skia';
import { Slider } from '@expo/ui/community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import { HapticTouchable } from '@/components/haptic-touchable';

const MAX_ZOOM = 4; // 4x max magnification
const RING = 2; // ring stroke width

// Circular crop with zoom/pan. The crop circle is FIXED and centered; the image is scaled
// and panned beneath it (standard avatar cropper). Zoom is driven by pinch, the slider, or
// double-nothing — all write the same `scale` shared value. On confirm we map the circle
// back through the image transform to original pixels and mask to a transparent-corner PNG.
export default function CropScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [sliderVal, setSliderVal] = useState(0); // 0..1 → minScale..minScale*MAX_ZOOM

  // Bake EXIF rotation; result w/h are the TRUE post-rotation dims (onLoad lies on rotated).
  const [src, setSrc] = useState<{ uri: string; w: number; h: number } | null>(null);
  useEffect(() => {
    let alive = true;
    ImageManipulator.manipulateAsync(imageUri, [], { format: ImageManipulator.SaveFormat.JPEG })
      .then((r) => alive && setSrc({ uri: r.uri, w: r.width, h: r.height }))
      .catch(() => alive && setSrc({ uri: imageUri, w: 0, h: 0 }));
    return () => {
      alive = false;
    };
  }, [imageUri]);

  const skiaSrc = useSkiaImage(src?.uri ?? null);

  // Stage geometry (measured) and crop circle (fixed).
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const cr = useSharedValue(0);

  // Image transform: uniform scale about the stage center + translation, in stage px.
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const minScale = useSharedValue(1); // scale at which the image just covers the circle
  const savedScale = useSharedValue(1);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStage({ w: width, h: height });
  };

  // Once we have both stage size and image size, set up the circle + initial cover scale.
  useEffect(() => {
    if (!stage.w || !src?.w) return;
    const r = (Math.min(stage.w, stage.h) / 2) * 0.9;
    cx.value = stage.w / 2;
    cy.value = stage.h / 2;
    cr.value = r;
    // Scale so the image (drawn centered at native size) covers the circle diameter.
    const cover = Math.max((2 * r) / src.w, (2 * r) / src.h);
    minScale.value = cover;
    scale.value = cover;
    savedScale.value = cover;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
    setSliderVal(0);
    setReady(true);
  }, [stage, src]);

  // Keep the image covering the circle: clamp translation so no gap shows inside the circle.
  const clampPan = () => {
    'worklet';
    if (!src?.w) return;
    const halfW = (src.w * scale.value) / 2;
    const halfH = (src.h * scale.value) / 2;
    const maxTx = Math.max(0, halfW - cr.value);
    const maxTy = Math.max(0, halfH - cr.value);
    tx.value = Math.max(-maxTx, Math.min(tx.value, maxTx));
    ty.value = Math.max(-maxTy, Math.min(ty.value, maxTy));
  };

  const setZoom = (v: number) => {
    'worklet';
    scale.value = minScale.value * (1 + v * (MAX_ZOOM - 1));
    clampPan();
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    })
    .onChange((ev) => {
      'worklet';
      tx.value = savedTx.value + ev.translationX;
      ty.value = savedTy.value + ev.translationY;
      clampPan();
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      savedScale.value = scale.value;
    })
    .onChange((ev) => {
      'worklet';
      const next = Math.max(minScale.value, Math.min(savedScale.value * ev.scale, minScale.value * MAX_ZOOM));
      scale.value = next;
      clampPan();
      // reflect back to the slider (0..1)
      const v = (next / minScale.value - 1) / (MAX_ZOOM - 1);
      runOnJS(setSliderVal)(Math.max(0, Math.min(1, v)));
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  // Skia transform for the preview: translate to center, apply scale+pan, draw image so its
  // center sits at origin.
  const transform = useDerivedValue(() => [
    { translateX: cx.value + tx.value },
    { translateY: cy.value + ty.value },
    { scale: scale.value },
  ]);
  const imgX = useDerivedValue(() => -(src?.w ?? 0) / 2);
  const imgY = useDerivedValue(() => -(src?.h ?? 0) / 2);
  const imgW = src?.w ?? 0;
  const imgH = src?.h ?? 0;

  const confirm = async () => {
    if (!src?.w || !skiaSrc || !ready) return;
    setBusy(true);
    try {
      // Preview maps image pixel px→stage as: stage = center + t + s·(px − imgCenter).
      // The circle sits at the stage center (cx,cy), so inverting at that point:
      //   px = w/2 − tx/s,  py = h/2 − ty/s,  radius_in_px = cr/s.
      const s = scale.value;
      const px = src.w / 2 - tx.value / s;
      const py = src.h / 2 - ty.value / s;
      const pr = cr.value / s; // radius in image px
      const side = Math.round(pr * 2);
      const originX = Math.round(px - pr);
      const originY = Math.round(py - pr);

      const surface = Skia.Surface.MakeOffscreen(side, side);
      if (!surface) throw new Error('offscreen surface failed');
      const canvas = surface.getCanvas();
      const path = Skia.Path.Make();
      path.addCircle(side / 2, side / 2, side / 2);
      canvas.clipPath(path, 1 /* Intersect */, true);
      canvas.drawImage(skiaSrc, -originX, -originY);
      surface.flush();

      const bytes = surface.makeImageSnapshot().encodeToBytes(ImageFormat.PNG, 100);
      const file = new File(Paths.cache, `crop-${side}.png`);
      file.write(bytes);
      router.replace({ pathname: '/select-face', params: { imageUri: file.uri } });
    } catch (e) {
      console.warn('Circular crop failed, using full photo:', e);
      router.replace({ pathname: '/select-face', params: { imageUri: src?.uri ?? imageUri } });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Crop the photo</Text>

      <GestureDetector gesture={gesture}>
        <View style={styles.stage} onLayout={onLayout}>
          {ready && skiaSrc && (
            <Canvas style={StyleSheet.absoluteFill}>
              <Group transform={transform}>
                <SkiaImage image={skiaSrc} x={imgX} y={imgY} width={imgW} height={imgH} fit="none" />
              </Group>
              {/* dim surround with a transparent circular hole. `layer` isolates this into
                  its own offscreen buffer so blendMode="clear" only erases the dim fill —
                  without it, "clear" punches through to the black page and hides the image. */}
              <Group layer>
                <Fill color="rgba(0,0,0,0.6)" />
                <Circle cx={cx} cy={cy} r={cr} color="black" blendMode="clear" />
              </Group>
              {/* white ring outline */}
              <Circle cx={cx} cy={cy} r={cr} color="white" style="stroke" strokeWidth={RING} />
            </Canvas>
          )}
        </View>
      </GestureDetector>

      {ready && (
        <View style={styles.sliderRow}>
          <Ionicons name="image-outline" size={16} color="#8E8E93" />
          <Slider
            style={styles.slider}
            value={sliderVal}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FFFFFF"
            thumbTintColor="#FFFFFF"
            onValueChange={(v) => {
              setSliderVal(v);
              setZoom(v);
            }}
          />
          <Ionicons name="image" size={24} color="#8E8E93" />
        </View>
      )}

      <View style={styles.footer}>
        <HapticTouchable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </HapticTouchable>
        <HapticTouchable style={styles.confirmBtn} onPress={confirm} disabled={busy || !ready}>
          {busy ? <ActivityIndicator color="#1C1C1E" /> : <Text style={styles.confirmText}>Continue</Text>}
        </HapticTouchable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  title: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', paddingVertical: 16 },
  stage: { flex: 1, marginHorizontal: 8 },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  slider: { flex: 1, height: 40 },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: '#3A3A3C', alignItems: 'center' },
  cancelText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center' },
  confirmText: { color: '#1C1C1E', fontSize: 17, fontWeight: '600' },
});
