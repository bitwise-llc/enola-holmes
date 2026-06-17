import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { imageUri } = await req.json()

    // Fetch the image
    const imageResponse = await fetch(imageUri)
    const imageBlob = await imageResponse.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    const imageData = new Uint8Array(arrayBuffer)

    // Use Face++ API for detection
    const formData = new FormData()
    formData.append('api_key', Deno.env.get('FACEPP_API_KEY') || '')
    formData.append('api_secret', Deno.env.get('FACEPP_API_SECRET') || '')
    formData.append('image_file', new Blob([imageData]))
    formData.append('return_landmark', '1')

    const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (result.faces && result.faces.length > 0) {
      const face = result.faces[0]
      const landmarks = face.landmark

      // Extract key facial landmarks
      const points = [
        landmarks.left_eye_center,
        landmarks.right_eye_center,
        landmarks.nose_tip,
        landmarks.mouth_left_corner,
        landmarks.mouth_right_corner,
        landmarks.mouth_lower_lip_bottom,
        landmarks.left_eyebrow_left_corner,
        landmarks.right_eyebrow_right_corner,
      ]

      return new Response(
        JSON.stringify({
          success: true,
          imageWidth: result.image_width,
          imageHeight: result.image_height,
          faceRectangle: face.face_rectangle,
          landmarks: points,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'No face detected' }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
