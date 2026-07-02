import { uploadAsync } from 'expo-file-system/legacy';
import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

export interface FaceSearchItem {
  score: number;
  url: string;
  base64?: string;
}

// Uploads the photo to our Edge Function, which holds the FaceCheck token server-side
// and returns the matches. The FaceCheck token is never on the device.
// Throws on network/HTTP failure; returns { error } for handled API errors.
export async function searchFace(
  imageUri: string,
): Promise<{ items?: FaceSearchItem[]; error?: string; code?: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await uploadAsync(
    `${SUPABASE_URL}/functions/v1/face-search`,
    imageUri,
    {
      httpMethod: 'POST',
      uploadType: 1, // MULTIPART
      fieldName: 'images',
      mimeType: imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
      headers: {
        accept: 'application/json',
        // Supabase Functions require the anon key; the user JWT authenticates the caller.
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session?.access_token ?? SUPABASE_KEY}`,
      },
    },
  );

  let data: any;
  try {
    data = JSON.parse(res.body);
  } catch {
    throw new Error('Invalid response from search service');
  }
  return data;
}
