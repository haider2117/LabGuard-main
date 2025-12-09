# Camera-Based Monitoring Module - Design Document

## Overview

This document describes the technical design and architecture for the camera-based monitoring module in LabGuard. The module detects mobile phones, counts persons, tracks gaze direction, estimates head pose, and detects blinks using computer vision and machine learning models.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CameraTestModule.tsx                                 │  │
│  │  - Display camera feed + overlays                     │  │
│  │  - Show detection status                              │  │
│  │  - Log violations                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ IPC (Electron renderer ↔ main)
┌─────────────────────────────────────────────────────────────┐
│              Electron Main Process (Node.js)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  cameraMonitoringService.js                          │  │
│  │  - Spawn Python subprocess                           │  │
│  │  - Parse JSON from stdout                            │  │
│  │  - Forward to renderer                               │  │
│  │  - Handle errors                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ stdio/JSON
┌─────────────────────────────────────────────────────────────┐
│               Python Subprocess (ML/CV)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  camera_processor.py                                  │  │
│  │  ├─ ObjectDetector (YOLOv8n)                         │  │
│  │  │  └─ Phone detection, person counting              │  │
│  │  ├─ FaceAnalyzer (MediaPipe)                         │  │
│  │  │  └─ Face detection, landmarks, head pose          │  │
│  │  └─ GazeEstimator                                    │  │
│  │     └─ Gaze direction, blink detection               │  │
│  └──────────────────────────────────────────────────────┘  │
│               ↕                                             │
│         Webcam (OpenCV)                                     │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Python Side (ML/CV Processing)
- **Python 3.9-3.11** - Runtime environment
- **OpenCV (cv2)** - Camera access and image processing
- **MediaPipe** - Face mesh, landmarks, iris tracking, head pose
- **Ultralytics YOLOv8n** - Object detection (phone + person)
- **ONNX Runtime** (optional) - Optimized inference
- **NumPy** - Array operations

### Node.js Side (Integration)
- **child_process** - Spawn and manage Python subprocess
- **Electron IPC** - Communication between main and renderer processes
- **JSON** - Data serialization format

### Frontend Side (UI)
- **React + TypeScript** - UI framework
- **Canvas API** - Video rendering and overlay drawing
- **Electron IPC** - Communication with main process

## Model Selection

### Object Detection: YOLOv8n (Nano)
- **Model Size**: ~6 MB
- **Performance**: 20-40 FPS on CPU
- **Classes**: 
  - Class 0: "person"
  - Class 67: "cell phone"
- **Format**: PyTorch (.pt) or ONNX
- **Library**: Ultralytics

**Rationale**: Best balance of size, speed, and accuracy for phone/person detection. Smaller and faster than YOLOv3, more accurate than MobileNet-SSD.

### Face Analysis: MediaPipe Face Mesh
- **Model Size**: ~15 MB (includes all MediaPipe models)
- **Performance**: 30-60 FPS on CPU
- **Features**:
  - 468 facial landmarks
  - Iris tracking (4 landmarks per eye)
  - Head pose estimation (built-in)
  - Face detection (BlazeFace)
- **Library**: MediaPipe

**Rationale**: Comprehensive solution providing face detection, landmarks, head pose, and iris positions in one lightweight package. Production-ready from Google.

### Gaze Estimation: Heuristic-Based
- **Method**: Calculate gaze direction from iris landmarks
- **Blink Detection**: Eye Aspect Ratio (EAR) from landmarks
- **No additional model required**

**Rationale**: Sufficient accuracy for proctoring use case. Dedicated gaze models (e.g., ETH-XGaze) are overkill and much heavier.

## Project Structure

```
LabGuard-main/
├── backend/
│   ├── camera_monitoring/           # NEW: Camera monitoring module
│   │   ├── __init__.py
│   │   ├── camera_processor.py      # Main Python processing script
│   │   ├── detectors/
│   │   │   ├── __init__.py
│   │   │   ├── object_detector.py   # YOLOv8n for phone/person
│   │   │   ├── face_analyzer.py     # MediaPipe face mesh
│   │   │   └── gaze_estimator.py    # Gaze & blink detection
│   │   ├── models/                  # Model weights
│   │   │   ├── yolov8n.pt           # YOLOv8 nano model
│   │   │   └── .gitkeep
│   │   ├── utils/
│   │   │   └── __init__.py          # Utility module (geometry inline in detectors)
│   │   └── config.py                # Configuration constants
│   ├── services/
│   │   └── cameraMonitoringService.js  # Node.js IPC bridge
│   └── scripts/
│       └── setup-camera-monitoring.js  # Setup script for Python deps
│
├── frontend/
│   └── src/
│       └── components/
│           ├── CameraTestModule.tsx     # Test UI component
│           ├── CameraTestModule.css     # Styling
│           └── CameraMonitorDisplay.tsx # Reusable camera display
│
├── python_requirements.txt             # Python dependencies
└── package.json                        # Update with new scripts
```

## Component Design

### 1. Python Components

#### `camera_processor.py` (Main Processor)
**Responsibilities**:
- Initialize webcam using OpenCV
- Load and initialize ML models (YOLOv8n, MediaPipe)
- Main processing loop (capture → process → output)
- Send JSON status updates via stdout
- Handle shutdown signals gracefully

**Key Methods**:
- `initialize()` - Setup camera and models
- `process_frame(frame)` - Run all detectors on frame
- `run()` - Main loop
- `cleanup()` - Release resources

#### `detectors/object_detector.py` (Object Detection)
**Responsibilities**:
- Load YOLOv8n model
- Detect "cell phone" objects (class 67)
- Count "person" objects (class 0)
- Return bounding boxes and confidence scores

**Key Methods**:
- `load_model(model_path)` - Load YOLOv8n
- `detect(frame)` - Run detection
- `filter_phone_detections(results)` - Filter phone detections
- `count_persons(results)` - Count person detections

#### `detectors/face_analyzer.py` (Face Analysis)
**Responsibilities**:
- Initialize MediaPipe Face Mesh
- Detect face presence
- Extract 468 facial landmarks
- Calculate head pose (yaw, pitch, roll) using MediaPipe
- Get iris positions for gaze estimation

**Key Methods**:
- `initialize()` - Setup MediaPipe
- `detect_face(frame)` - Detect face and landmarks
- `calculate_head_pose(landmarks)` - Estimate head pose
- `get_iris_positions(landmarks)` - Extract iris landmarks

#### `detectors/gaze_estimator.py` (Gaze & Blink)
**Responsibilities**:
- Calculate gaze direction from iris landmarks (left/right/center)
- Calculate Eye Aspect Ratio (EAR) for blink detection
- Determine if student is looking at screen
- Track head orientation (facing screen or not)

**Key Methods**:
- `estimate_gaze(iris_positions, head_pose)` - Calculate gaze direction
- `calculate_ear(eye_landmarks)` - Eye Aspect Ratio
- `detect_blink(ear, threshold)` - Blink detection
- `is_facing_screen(head_pose)` - Check orientation

#### Geometry Utilities (Inline)
> **Note**: Originally planned as `utils/geometry.py`, but geometry calculations
> are now implemented inline within `face_analyzer.py` and `gaze_estimator.py`
> to avoid a planning sequencing issue and reduce unnecessary abstraction.

**Functionality** (encapsulated in detector modules):
- Head pose calculations (in `face_analyzer.py`)
- Coordinate transformations (in `face_analyzer.py`)
- Angle calculations (in `gaze_estimator.py`)
- Distance/EAR measurements (in `gaze_estimator.py`)

### 2. Node.js Components

#### `cameraMonitoringService.js` (IPC Bridge)
**Responsibilities**:
- Spawn and manage Python subprocess
- Parse JSON from Python stdout
- Forward status updates to renderer via IPC
- Handle Python process errors and crashes
- Manage camera resource lifecycle

**Key Methods**:
- `startMonitoring()` - Spawn Python process
- `stopMonitoring()` - Kill Python process
- `parseStatusUpdate(data)` - Parse JSON from stdout
- `handleError(error)` - Error handling

**IPC Handlers**:
- `camera:start-test` - Start Python subprocess
- `camera:stop-test` - Kill Python subprocess
- `camera:get-status` - Get current monitoring status
- `camera:status-update` - Event: Send updates to frontend

### 3. Frontend Components

#### `CameraTestModule.tsx` (Test UI)
**Responsibilities**:
- Display live camera feed with overlays
- Show detection status (phone, persons, gaze, etc.)
- Display violation logs
- Provide start/stop controls
- Handle IPC communication

**Key Features**:
- Video display with canvas overlays
- Bounding boxes for detected objects
- Status panel with real-time metrics
- Violation log with timestamps
- Settings panel (optional)

#### `CameraMonitorDisplay.tsx` (Reusable Display)
**Responsibilities**:
- Reusable component for camera feed display
- Overlay rendering (boxes, text, indicators)
- Performance optimization (frame skipping, canvas updates)

## Data Flow

### 1. Initialization Flow
```
User clicks "Test Camera Module"
  → Frontend sends IPC: camera:start-test
  → Node.js spawns Python subprocess
  → Python loads models (YOLOv8n, MediaPipe)
  → Python initializes webcam
  → Python sends ready status
  → Node.js forwards to frontend
  → Frontend displays camera feed
```

### 2. Processing Loop
```
Python captures frame from webcam
  → Run YOLOv8n detection (phone + person)
  → Run MediaPipe Face Mesh (face + landmarks)
  → Calculate head pose from landmarks
  → Estimate gaze from iris positions
  → Calculate blink (EAR)
  → Compile JSON status
  → Send to stdout
  → Node.js receives JSON
  → Node.js forwards to renderer via IPC
  → Frontend updates UI (overlays, status, logs)
```

### 3. Shutdown Flow
```
User clicks "Stop Monitoring"
  → Frontend sends IPC: camera:stop-test
  → Node.js sends SIGTERM to Python
  → Python releases camera and models
  → Python process exits
  → Node.js confirms shutdown
  → Frontend hides camera feed
```

## Communication Protocol

### Python → Node.js (JSON via stdout)

**Status Update Format** (sent every frame, ~30 FPS):
```json
{
  "timestamp": 1702345678901,
  "fps": 28.5,
  "detections": {
    "phone": {
      "detected": true,
      "confidence": 0.87,
      "bbox": [120, 150, 80, 120]
    },
    "persons": {
      "count": 2,
      "bboxes": [
        [50, 30, 200, 350],
        [300, 40, 180, 340]
      ]
    }
  },
  "face": {
    "detected": true,
    "landmarks_count": 468,
    "head_pose": {
      "yaw": -12.5,
      "pitch": 8.3,
      "roll": 1.2
    },
    "orientation": "facing_screen"
  },
  "gaze": {
    "direction": "left",
    "looking_at_screen": false,
    "horizontal_angle": -25.0
  },
  "blink": {
    "is_blinking": false,
    "left_eye_ear": 0.28,
    "right_eye_ear": 0.29
  },
  "violations": {
    "phone_violation": true,
    "multiple_persons": true,
    "not_looking_at_screen": true
  },
  "frame_jpeg_base64": "/9j/4AAQSkZJRgABAQAAAQ..." // Optional
}
```

**Error Format**:
```json
{
  "error": true,
  "error_type": "camera_access_denied",
  "message": "Could not access webcam: Permission denied"
}
```

### Node.js → Python (JSON via stdin, optional)

**Command Format**:
```json
{
  "command": "update_config",
  "config": {
    "detection_confidence": 0.5,
    "enable_frame_transmission": true,
    "frame_skip": 2
  }
}
```

## Configuration

### `config.py` (Python Configuration)

```python
# Detection thresholds
PHONE_CONFIDENCE_THRESHOLD = 0.5
PERSON_CONFIDENCE_THRESHOLD = 0.6

# Gaze estimation
GAZE_LEFT_THRESHOLD = -20.0   # degrees (negative = left)
GAZE_RIGHT_THRESHOLD = 20.0   # degrees (positive = right)
GAZE_CENTER_THRESHOLD = 12.0  # tolerance for "center"

# Blink detection
BLINK_EAR_THRESHOLD = 0.25
BLINK_FRAME_COUNT = 3  # Consecutive frames for blink confirmation

# Head pose (degrees)
HEAD_FACING_SCREEN_YAW_RANGE = (-30.0, 30.0)
HEAD_FACING_SCREEN_PITCH_RANGE = (-35.0, 20.0)  # Expanded downward to account for typing

# Performance
CAMERA_WIDTH = 640
CAMERA_HEIGHT = 480
TARGET_FPS = 30
ENABLE_GPU = False  # Set to True if CUDA available
FRAME_SKIP = 1  # Process every Nth frame (1 = all frames)

# Model paths
YOLO_MODEL_PATH = "backend/camera_monitoring/models/yolov8n.pt"
MEDIAPIPE_MODEL_PATH = None  # MediaPipe handles model loading

# Output settings
ENABLE_FRAME_TRANSMISSION = False  # Send frame as base64 (slower)
JSON_OUTPUT_ENABLED = True
```

## Performance Considerations

### Optimization Strategies

1. **Frame Skipping**: Process every Nth frame to reduce CPU load
2. **Resolution**: Use 640x480 instead of full HD
3. **Model Quantization**: Use quantized models if available
4. **Async Processing**: Run detectors in parallel where possible
5. **Selective Updates**: Only send frame data when violations detected
6. **GPU Acceleration**: Use CUDA if available (future enhancement)

### Expected Performance

- **YOLOv8n**: 20-40 FPS on CPU (Intel i5/i7)
- **MediaPipe**: 30-60 FPS on CPU
- **Combined Pipeline**: 20-30 FPS (bottleneck is YOLOv8n)
- **Latency**: <100ms end-to-end (camera → UI update)

## Error Handling

### Python Errors
- **Camera Access Denied**: Return error JSON, don't crash
- **Model Loading Failure**: Log error, return error JSON
- **Frame Capture Failure**: Skip frame, continue processing
- **Model Inference Error**: Log error, return partial results

### Node.js Errors
- **Python Process Crash**: Restart process, notify frontend
- **JSON Parse Error**: Log malformed JSON, skip update
- **IPC Send Failure**: Queue updates, retry when available

### Frontend Errors
- **Camera Feed Not Available**: Show placeholder, log error
- **IPC Disconnect**: Show reconnection UI
- **Memory Issues**: Limit frame history, clear canvas

## Security Considerations

1. **Camera Access**: Request permission explicitly
2. **Data Privacy**: No frame storage (unless violation detected)
3. **Process Isolation**: Python runs in separate process
4. **Input Validation**: Validate all JSON from Python
5. **Resource Limits**: Timeout for Python process if unresponsive

## Future Enhancements

1. **GPU Acceleration**: CUDA support for YOLOv8
2. **Advanced Gaze Models**: Replace heuristic with ETH-XGaze
3. **Behavioral Analysis**: Detect suspicious patterns over time
4. **Audio Detection**: Detect speech/conversations
5. **Multi-Camera Support**: Support external webcams
6. **Video Recording**: Save violation evidence
7. **Cloud Sync**: Upload snapshots to cloud storage
8. **Real-time Alerts**: Push notifications for violations

## Dependencies

### Python (`python_requirements.txt`)
```
opencv-python==4.8.1.78
mediapipe==0.10.9
ultralytics==8.1.0
numpy==1.24.3
Pillow==10.1.0
```

### Node.js (existing)
- No new dependencies required (uses built-in `child_process`)

### Frontend (existing)
- No new dependencies required (uses existing React/TypeScript stack)

## Bundle Size Impact

- **YOLOv8n model**: ~6 MB
- **MediaPipe models**: ~15 MB
- **Python runtime** (embedded): ~50-80 MB
- **OpenCV, MediaPipe, Ultralytics libs**: ~100-150 MB
- **Total additional size**: ~170-250 MB

## Testing Strategy

### Unit Tests
- Python: Test each detector independently with mock frames
- Node.js: Test IPC communication with mock Python output
- Frontend: Test component rendering with mock data

### Integration Tests
- End-to-end: Frontend → Node.js → Python → Webcam
- Error scenarios: Camera denied, model failures, process crashes

### Manual Test Scenarios
- ✅ No violations (single person, no phone, looking at screen)
- ⚠️ Phone in frame
- ⚠️ Multiple persons
- ⚠️ Looking away from screen
- ⚠️ No face detected
- ⚠️ All violations simultaneously
- ⚠️ Camera access denied
- ⚠️ Python process crash recovery

---

## Change Log

| Date | Changes | Author |
|------|---------|--------|
| 2024-01-15 | Initial design document created | LabGuard Team |
| 2024-12-09 | Updated threshold values to match implementation: GAZE thresholds (-20/20/12°), HEAD_POSE pitch range (-35° to 20°). Removed geometry.py reference (now inline in detectors). | AI Assistant |

