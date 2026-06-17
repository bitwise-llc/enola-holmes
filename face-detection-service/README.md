# Face Detection Service

FastAPI service that detects facial landmarks using MediaPipe Face Mesh.

## Setup

1. Install Python dependencies:
```bash
cd face-detection-service
pip install -r requirements.txt
```

2. Start the service:
```bash
python main.py
```

The service will run on `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```

### Detect Face
```
POST /detect-face
```

Upload an image file and get back facial landmark coordinates.

**Request:**
- Multipart form data with `file` field containing the image

**Response:**
```json
{
  "faceDetected": true,
  "numFaces": 1,
  "facialPoints": [
    {
      "type": "eye",
      "x": 0.382,
      "y": 0.341
    }
  ],
  "imageWidth": 1920,
  "imageHeight": 1080,
  "totalLandmarks": 150
}
```

## Landmark Types

- `outline`: Face contour/jawline
- `eyebrow`: Eyebrow points
- `eye`: Eye contour points
- `nose`: Nose bridge, tip, and base
- `mouth`: Lip contours

## Testing

```bash
curl -X POST http://localhost:8000/detect-face \
  -F "file=@/path/to/image.jpg"
```

## Production Deployment

For production, use a proper ASGI server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or deploy to:
- Railway
- Render
- AWS Lambda with Mangum
- Google Cloud Run
- Azure Container Instances
