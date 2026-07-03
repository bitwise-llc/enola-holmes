import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { HapticTouchable } from '@/components/haptic-touchable';

// A face rectangle in ORIGINAL-image pixel coordinates.
type Rect = { top: number; left: number; width: number; height: number };

// Normalizes the various detect-face response shapes into a list of pixel rectangles.
// The Railway detector may return a `faces` array (Face++ shape) or a single
// `faceRectangle`. Anything else → no boxes, and we skip the picker.
function parseFaces(data: any): { faces: Rect[]; imageWidth: number; imageHeight: number } {
  const imageWidth = data?.imageWidth ?? data?.image_width ?? 0;
  const imageHeight = data?.imageHeight ?? data?.image_height ?? 0;
  const toRect = (r: any): Rect | null =>
    r && typeof r.width === 'number'
      ? { top: r.top, left: r.left, width: r.width, height: r.height }
      : null;

  let faces: Rect[] = [];
  if (Array.isArray(data?.faces)) {
    faces = data.faces.map((f: any) => toRect(f.face_rectangle ?? f)).filter(Boolean) as Rect[];
  } else if (data?.faceRectangle) {
    const r = toRect(data.faceRectangle);
    if (r) faces = [r];
  }
  return { faces, imageWidth, imageHeight };
}

export default function SelectFaceScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [status, setStatus] = useState<'detecting' | 'ready' | 'cropping'>('detecting');
  const [faces, setFaces] = useState<Rect[]>([]);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  // The photo's on-screen frame, measured after layout, so we can map pixel rects to pixels.
  const [frame, setFrame] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    detect();
  }, []);

  const goScan = (uri: string) =>
    router.replace({ pathname: '/scanning', params: { imageUri: uri } });

  const detect = async () => {
    const baseUrl = process.env.EXPO_PUBLIC_FACE_DETECT_URL;
    if (!baseUrl) return goScan(imageUri); // no detector configured → search the whole photo

    try {
      const form = new FormData();
      form.append('file', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      const res = await fetch(`${baseUrl}/detect-face`, { method: 'POST', body: form });
      const data = await res.json();
      const { faces, imageWidth, imageHeight } = parseFaces(data);

      // 0 or 1 face → nothing to choose; forward the original photo unchanged.
      if (faces.length < 2 || !imageWidth || !imageHeight) return goScan(imageUri);

      setImgSize({ width: imageWidth, height: imageHeight });
      setFaces(faces);
      setStatus('ready');
    } catch (e) {
      console.warn('Face detect failed, skipping picker:', e);
      goScan(imageUri);
    }
  };

  // Compute how the contain-fitted image sits inside the frame, so overlay boxes line up.
  const onFrameLayout = (e: LayoutChangeEvent) => {
    const { width: fw, height: fh } = e.nativeEvent.layout;
    if (!imgSize.width) return;
    const scale = Math.min(fw / imgSize.width, fh / imgSize.height);
    const dispW = imgSize.width * scale;
    const dispH = imgSize.height * scale;
    setFrame({ width: dispW, height: dispH, offsetX: (fw - dispW) / 2, offsetY: (fh - dispH) / 2 });
  };

  const selectFace = async (rect: Rect) => {
    setStatus('cropping');
    try {
      // Pad the tight face box by 40% so the crop includes hair/chin — face search
      // matches better with a bit of context than a cheek-to-cheek crop.
      const pad = 0.4;
      const px = Math.max(0, rect.left - rect.width * pad);
      const py = Math.max(0, rect.top - rect.height * pad);
      const pw = Math.min(imgSize.width - px, rect.width * (1 + pad * 2));
      const ph = Math.min(imgSize.height - py, rect.height * (1 + pad * 2));

      // ponytail: manipulateAsync is deprecated in SDK 56 in favor of the context API,
      // but the context API isn't typed in this installed version. One-shot crop, so the
      // deprecated call is the smaller, typed path. Swap to ImageManipulator.manipulate()
      // if a future upgrade types it.
      const out = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: { originX: px, originY: py, width: pw, height: ph } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 }
      );
      goScan(out.uri);
    } catch (e) {
      console.warn('Crop failed, using full photo:', e);
      goScan(imageUri);
    }
  };

  const scale = frame.width && imgSize.width ? frame.width / imgSize.width : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tap the face to search</Text>

      <View style={styles.imageFrame} onLayout={onFrameLayout}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="contain" />

        {status === 'ready' &&
          scale > 0 &&
          faces.map((f, i) => (
            <HapticTouchable
              key={i}
              onPress={() => selectFace(f)}
              style={[
                styles.faceBox,
                {
                  left: frame.offsetX + f.left * scale,
                  top: frame.offsetY + f.top * scale,
                  width: f.width * scale,
                  height: f.height * scale,
                },
              ]}
            >
              <View style={styles.faceBadge}>
                <Text style={styles.faceBadgeText}>{i + 1}</Text>
              </View>
            </HapticTouchable>
          ))}
      </View>

      {status !== 'ready' ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.overlayText}>
            {status === 'cropping' ? 'Preparing…' : 'Finding faces…'}
          </Text>
        </View>
      ) : (
        <Text style={styles.hint}>We found multiple faces. Tap the one you want to look up.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  imageFrame: { flex: 1, marginHorizontal: 8 },
  faceBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  faceBadge: {
    position: 'absolute',
    top: -12,
    left: -12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  faceBadgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  hint: {
    color: '#C7C7CC',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  overlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  overlayText: { color: '#FFFFFF', fontSize: 15 },
});
