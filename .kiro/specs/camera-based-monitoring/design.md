# Design Document: Camera-Based Monitoring System

## Overview

The Camera-Based Monitoring System is a lightweight, real-time proctoring module for the LabGuard desktop application. It leverages computer vision to detect potential cheating behaviors during exams by analyzing webcam feeds. The system is architected as a Python-based backend service that communicates with the Electron frontend via IPC (Inter-Process Communication).

### Design Goals

1. **Performance**: Achieve 15-25 FPS on CPU-only systems with <65ms average latency
2. **Lightweight**: Keep total model size under 20MB and memory usage under 500MB
3. **Modularity**: Separate detection components for easy testing and maintenance
4. **Reliability**: Graceful degradation when individual components fail
5. **Developer Experience**: Standalone test mode for rapid development without authentication

### Technology Stack

- **Object Detection**: YOLOv8n (Ultralytics) for person and mobile phone detection
- **Face Analysis**: MediaPipe Face Mesh for face detection, landmarks, iris tracking, gaze, and head pose
- **Backend**: Python 3.9+ with OpenCV, NumPy
- **Frontend**: React (TypeScript) + Electron
- **IPC**: Electron IPC for Python ↔ React communication
- **Video Processing**: OpenCV for webcam capture and frame processing

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Python Camera Service                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │   YOLOv8n    │  │  MediaPipe   │  │   OpenCV    │  │ │
│  │  │   Detector   │  │  Face Mesh   │  │   Capture   │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  │         │                  │                 │          │ │
│  │         └──────────────────┴─────────────────┘          │ │
│  │                           │                              │ │
│  │                  ┌────────▼────────┐                    │ │
│  │                  │  Frame Processor │                    │ │
│  │                  └────────┬────────┘                    │ │
│  │                           │                              │ │
│  │                  ┌────────▼────────┐                    │ │
│  │                  │ Violation Engine │                    │ │
│  │                  └────────┬────────┘                    │ │
│  │                           │                              │ │
│  │                  ┌────────▼────────┐                    │ │
│  │                  │  Event Logger    │                    │ │
│  │                  └─────────────────┘                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │ IPC                              │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Renderer Process (React)                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │ Login Screen │  │ Test Camera  │  │   Student   │  │ │
│  │  │              │  │    Module    │  │  Dashboard  │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
1. User clicks "Test Camera Module" button
   ↓
2. React sends IPC message: 'start-camera-monitoring'
   ↓
3. Electron Main spawns Python process
   ↓
4. Python initializes models (YOLOv8n + MediaPipe)
   ↓
5. Python opens webcam via OpenCV
   ↓
6. Frame Processing Loop:
   ├─ Capture frame
   ├─ Run YOLOv8n detection (phones, people)
   ├─ Run MediaPipe Face Mesh (face, landmarks, iris)
   ├─ Calculate gaze direction
   ├─ Calculate head pose
   ├─ Detect blinks
   ├─ Check violation rules
   ├─ Draw overlays
   ├─ Display frame
   └─ Send events to Electron via stdout/IPC
   ↓
7. Electron forwards events to React
   ↓
8. React displays logs and status updates
```

---

## Components and Interfaces

### 1. Python Camera Service (`backend/services/cameraMonitoring/`)

#### 1.1 Main Service (`camera_service.py`)

**Responsibilities:**
- Initialize and manage the monitoring pipeline
- Coordinate between detection modules
- Handle IPC communication with Electron
- Manage webcam lifecycle

**Key Methods:**
```python
class CameraMonitoringService:
    def __init__(self, config: dict)
    def start_monitoring(self) -> None
    def stop_monitoring(self) -> None
    def process_frame(self, frame: np.ndarray) -> dict
    def send_event(self, event: dict) -> None
```

**Configuration Interface:**
```python
{
    "camera_index": 0,
    "frame_width": 640,
    "frame_height": 480,
    "target_fps": 30,
    "phone_confidence_threshold": 0.5,
    "person_confidence_threshold": 0.5,
    "gaze_away_duration_threshold": 3.0,
    "head_yaw_threshold": 45,
    "head_pitch_threshold": 30,
    "blink_ear_threshold": 0.2,
    "no_blink_duration_threshold": 10.0,
    "enable_display": true,
    "enable_logging": true
}
```

#### 1.2 YOLO Detector (`yolo_detector.py`)

**Responsibilities:**
- Load YOLOv8n model
- Detect persons and mobile phones
- Return bounding boxes and confidence scores

**Interface:**
```python
class YOLODetector:
    def __init__(self, model_path: str, confidence_threshold: float)
    def detect(self, frame: np.ndarray) -> DetectionResult
    
class DetectionResult:
    phones: List[BoundingBox]
    persons: List[BoundingBox]
    
class BoundingBox:
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float
    class_name: str
```

#### 1.3 Face Analyzer (`face_analyzer.py`)

**Responsibilities:**
- Initialize MediaPipe Face Mesh
- Detect face and extract 468 landmarks
- Track iris positions
- Calculate gaze direction
- Calculate head pose angles
- Detect blinks via Eye Aspect Ratio (EAR)

**Interface:**
```python
class FaceAnalyzer:
    def __init__(self)
    def analyze(self, frame: np.ndarray) -> FaceAnalysisResult
    
class FaceAnalysisResult:
    face_detected: bool
    landmarks: np.ndarray  # 468x3 array
    iris_left: np.ndarray  # 5x3 array
    iris_right: np.ndarray  # 5x3 array
    gaze_direction: GazeDirection
    head_pose: HeadPose
    blink_detected: bool
    ear_left: float
    ear_right: float
    
class GazeDirection(Enum):
    CENTER = "center"
    LEFT = "left"
    RIGHT = "right"
    UP = "up"
    DOWN = "down"
    UNKNOWN = "unknown"
    
class HeadPose:
    pitch: float  # degrees
    yaw: float    # degrees
    roll: float   # degrees
```

#### 1.4 Violation Engine (`violation_engine.py`)

**Responsibilities:**
- Track violation states over time
- Apply duration thresholds
- Generate violation events
- Maintain violation history

**Interface:**
```python
class ViolationEngine:
    def __init__(self, config: dict)
    def update(self, detections: dict) -> List[Violation]
    def get_active_violations(self) -> List[Violation]
    def reset(self) -> None
    
class Violation:
    type: ViolationType
    severity: Severity
    start_time: float
    end_time: Optional[float]
    metadata: dict
    
class ViolationType(Enum):
    PHONE_DETECTED = "phone_detected"
    NO_PERSON = "no_person"
    MULTIPLE_PERSONS = "multiple_persons"
    FACE_NOT_VISIBLE = "face_not_visible"
    SUSPICIOUS_GAZE = "suspicious_gaze"
    HEAD_TURNED_AWAY = "head_turned_away"
    HEAD_TILTED = "head_tilted"
    NO_BLINK = "no_blink"
    
class Severity(Enum):
    WARNING = "warning"
    VIOLATION = "violation"
```

#### 1.5 Event Logger (`event_logger.py`)

**Responsibilities:**
- Log all detection events to JSON file
- Track session metadata
- Provide log retrieval interface

**Interface:**
```python
class EventLogger:
    def __init__(self, session_id: str, log_dir: str)
    def log_event(self, event: Event) -> None
    def log_violation(self, violation: Violation) -> None
    def close(self) -> str  # Returns log file path
    
class Event:
    timestamp: float
    frame_number: int
    event_type: str
    data: dict
```

#### 1.6 Frame Renderer (`frame_renderer.py`)

**Responsibilities:**
- Draw bounding boxes for detections
- Draw facial landmarks and iris points
- Draw gaze and head pose indicators
- Display violation warnings
- Display FPS and status text

**Interface:**
```python
class FrameRenderer:
    def render(self, frame: np.ndarray, detections: dict, violations: List[Violation]) -> np.ndarray
    def draw_bounding_boxes(self, frame: np.ndarray, boxes: List[BoundingBox]) -> None
    def draw_face_landmarks(self, frame: np.ndarray, landmarks: np.ndarray) -> None
    def draw_gaze_indicator(self, frame: np.ndarray, gaze: GazeDirection) -> None
    def draw_head_pose(self, frame: np.ndarray, pose: HeadPose) -> None
    def draw_violations(self, frame: np.ndarray, violations: List[Violation]) -> None
```

### 2. Electron IPC Bridge (`backend/services/cameraMonitoringBridge.js`)

**Responsibilities:**
- Spawn Python process
- Handle IPC communication between Python and Electron
- Forward events to renderer process
- Manage process lifecycle

**Interface:**
```javascript
class CameraMonitoringBridge {
    constructor()
    startMonitoring(config): Promise<void>
    stopMonitoring(): Promise<void>
    onEvent(callback: (event) => void): void
    onError(callback: (error) => void): void
}
```

**IPC Events:**
```javascript
// Main → Renderer
'camera-monitoring-started'
'camera-monitoring-stopped'
'camera-monitoring-event' // Detection events
'camera-monitoring-violation' // Violation events
'camera-monitoring-error'

// Renderer → Main
'start-camera-monitoring'
'stop-camera-monitoring'
```

### 3. React Components

#### 3.1 Test Camera Module Component (`frontend/src/components/TestCameraModule.tsx`)

**Responsibilities:**
- Provide UI for test mode
- Display event logs
- Show violation summary
- Control monitoring start/stop

**Props:**
```typescript
interface TestCameraModuleProps {
    onClose: () => void;
}
```

**State:**
```typescript
interface TestCameraModuleState {
    isMonitoring: boolean;
    events: Event[];
    violations: Violation[];
    stats: {
        fps: number;
        totalFrames: number;
        totalViolations: number;
    };
}
```

#### 3.2 Login Screen Update (`frontend/src/components/Login.tsx`)

**Changes:**
- Add "Test Camera Module" button
- Handle button click to open test mode
- Conditionally show button (only in development or with feature flag)

---

## Data Models

### Detection Frame Data

```typescript
interface FrameData {
    frameNumber: number;
    timestamp: number;
    fps: number;
    detections: {
        phones: BoundingBox[];
        persons: BoundingBox[];
        face: FaceData | null;
    };
    violations: Violation[];
}

interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    confidence: number;
    className: string;
}

interface FaceData {
    detected: boolean;
    gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down' | 'unknown';
    headPose: {
        pitch: number;
        yaw: number;
        roll: number;
    };
    blinkDetected: boolean;
    earLeft: number;
    earRight: number;
}

interface Violation {
    type: string;
    severity: 'warning' | 'violation';
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata: Record<string, any>;
}
```

### Configuration Model

```typescript
interface CameraMonitoringConfig {
    camera: {
        index: number;
        width: number;
        height: number;
        targetFps: number;
    };
    detection: {
        phoneConfidenceThreshold: number;
        personConfidenceThreshold: number;
    };
    violations: {
        gazeAwayDurationThreshold: number;
        headYawThreshold: number;
        headPitchThreshold: number;
        blinkEarThreshold: number;
        noBlinkDurationThreshold: number;
    };
    display: {
        enableOverlays: boolean;
        showFps: boolean;
        showLandmarks: boolean;
    };
    logging: {
        enabled: boolean;
        logDirectory: string;
    };
}
```

### Log File Format

```json
{
    "sessionId": "uuid-v4",
    "startTime": 1234567890.123,
    "endTime": 1234567900.456,
    "config": { /* CameraMonitoringConfig */ },
    "events": [
        {
            "timestamp": 1234567890.5,
            "frameNumber": 150,
            "type": "phone_detected",
            "data": {
                "confidence": 0.87,
                "boundingBox": { "x1": 100, "y1": 200, "x2": 150, "y2": 250 }
            }
        },
        {
            "timestamp": 1234567891.2,
            "frameNumber": 171,
            "type": "violation_started",
            "data": {
                "violationType": "suspicious_gaze",
                "severity": "warning"
            }
        }
    ],
    "summary": {
        "totalFrames": 1500,
        "averageFps": 22.5,
        "totalViolations": 3,
        "violationsByType": {
            "suspicious_gaze": 2,
            "phone_detected": 1
        }
    }
}
```

---

## Error Handling

### Error Categories

1. **Initialization Errors**
   - Webcam not accessible
   - Model loading failures
   - Invalid configuration

2. **Runtime Errors**
   - Frame capture failures
   - Detection failures (YOLO or MediaPipe)
   - IPC communication errors

3. **Resource Errors**
   - Out of memory
   - CPU overload (frame processing too slow)
   - Disk space for logging

### Error Handling Strategy

```python
class ErrorHandler:
    def handle_webcam_error(self, error: Exception) -> RecoveryAction
    def handle_model_error(self, model: str, error: Exception) -> RecoveryAction
    def handle_frame_error(self, error: Exception) -> RecoveryAction
    
class RecoveryAction(Enum):
    RETRY = "retry"
    SKIP_FRAME = "skip_frame"
    DEGRADE_GRACEFULLY = "degrade"  # Continue with partial functionality
    ABORT = "abort"
```

### Graceful Degradation

- **If YOLOv8n fails**: Continue with MediaPipe face analysis only
- **If MediaPipe fails**: Continue with YOLOv8n object detection only
- **If both fail**: Log error, notify user, attempt recovery every 30 seconds
- **If webcam fails**: Retry 3 times with 1-second delay, then abort with clear error message

### Error Messages

```typescript
interface ErrorMessage {
    code: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    technicalDetails?: string;
    suggestedAction?: string;
}
```

**Example Error Messages:**
- `WEBCAM_NOT_FOUND`: "Camera not accessible. Please check camera permissions and ensure no other application is using it."
- `MODEL_LOAD_FAILED`: "Failed to load detection model. Please reinstall the application."
- `FRAME_PROCESSING_SLOW`: "Frame processing is slower than expected. Consider closing other applications."

---

## Testing Strategy

### Unit Tests

**Python Components:**
- `test_yolo_detector.py`: Test YOLO detection with sample images
- `test_face_analyzer.py`: Test MediaPipe face analysis with sample images
- `test_violation_engine.py`: Test violation logic with mock detections
- `test_event_logger.py`: Test logging functionality
- `test_frame_renderer.py`: Test rendering functions

**Test Data:**
- Sample images with phones, multiple people, single person
- Sample images with faces at different angles
- Mock detection results for violation engine testing

### Integration Tests

- `test_camera_service_integration.py`: Test full pipeline with recorded video
- `test_ipc_bridge.js`: Test Electron ↔ Python communication
- `test_end_to_end.py`: Test complete flow from camera to log file

### Performance Tests

- Measure FPS on target hardware (dual-core laptop)
- Measure CPU and memory usage
- Measure model loading time
- Measure frame processing latency

### Manual Testing Checklist

- [ ] Test mode button appears on login screen
- [ ] Clicking test button opens camera feed
- [ ] Phone detection works with real phone
- [ ] Multiple person detection works
- [ ] Gaze tracking responds to eye movement
- [ ] Head pose tracking responds to head movement
- [ ] Blink detection works
- [ ] Violations appear as overlays
- [ ] Event log displays in UI
- [ ] Pressing 'q' closes camera window
- [ ] Log file is created and contains events
- [ ] Error handling works (cover webcam, disconnect camera)

---

## Performance Optimization

### Frame Processing Pipeline Optimization

1. **Resize frames**: Process at 640x480 instead of higher resolutions
2. **Skip frames**: If processing takes >100ms, skip to next frame
3. **Parallel processing**: Run YOLO and MediaPipe in separate threads (future enhancement)
4. **Model optimization**: Use ONNX runtime for faster inference (future enhancement)

### Memory Management

- Reuse frame buffers instead of allocating new ones
- Limit event log size in memory (flush to disk periodically)
- Release model resources properly on shutdown

### CPU Optimization

- Use OpenCV's optimized functions
- Minimize Python loops, use NumPy vectorized operations
- Reduce overlay drawing complexity when not in test mode

---

## Security Considerations

1. **Camera Access**: Request camera permissions explicitly
2. **Data Privacy**: Log files should not contain raw frames, only metadata
3. **Model Integrity**: Verify model checksums on load
4. **IPC Security**: Validate all messages between processes
5. **File System**: Store logs in user-specific directories with appropriate permissions

---

## Future Enhancements

1. **GPU Acceleration**: Add CUDA support for NVIDIA GPUs
2. **Model Optimization**: Convert models to ONNX for faster inference
3. **Advanced Gaze**: Implement screen coordinate mapping for precise gaze tracking
4. **Emotion Detection**: Add facial expression analysis
5. **Audio Monitoring**: Detect speech/noise levels
6. **Cloud Sync**: Optional cloud backup of violation logs
7. **Real-time Alerts**: Push notifications to proctor dashboard
8. **Calibration**: Per-user gaze calibration for improved accuracy

---

## Deployment Considerations

### Model Distribution

- Models bundled with application installer
- Fallback download mechanism if models missing
- Model version checking and updates

### Python Environment

- Bundle Python runtime with Electron app (using PyInstaller or similar)
- Include all dependencies (OpenCV, MediaPipe, Ultralytics)
- Ensure compatibility with Windows 10/11

### Installation

- Installer should verify camera availability
- Request camera permissions during first run
- Create necessary directories for logs and models

### Updates

- Model updates via application update mechanism
- Configuration updates without full reinstall
- Backward compatibility for log file formats
