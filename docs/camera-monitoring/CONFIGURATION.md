# Camera Monitoring Module - Configuration Guide

## Overview

This document describes all configuration options available in the camera monitoring module. Configuration is managed through `backend/camera_monitoring/config.py`.

## Quick Configuration Reference

| Category | Key Settings | Default Value |
|----------|-------------|---------------|
| Phone Detection | `PHONE_CONFIDENCE_THRESHOLD` | 0.5 |
| Person Detection | `PERSON_CONFIDENCE_THRESHOLD` | 0.6 |
| Gaze Direction | `GAZE_LEFT_THRESHOLD` | -20° |
| Gaze Direction | `GAZE_RIGHT_THRESHOLD` | 20° |
| Blink Detection | `BLINK_EAR_THRESHOLD` | 0.25 |
| Head Pose | `HEAD_YAW_RANGE` | (-30°, 30°) |
| Head Pose | `HEAD_PITCH_RANGE` | (-20°, 20°) |
| Camera | `CAMERA_WIDTH` | 640 |
| Camera | `CAMERA_HEIGHT` | 480 |
| Camera | `TARGET_FPS` | 30 |
| Performance | `FRAME_SKIP` | 1 |
| Performance | `MAX_FRAME_PROCESSING_TIME_MS` | 100ms |

## Detection Thresholds

### Phone Detection

```python
PHONE_CONFIDENCE_THRESHOLD = 0.5
```
- **Range**: 0.0 to 1.0
- **Description**: Minimum confidence score for phone detection
- **Lower values**: More sensitive (may have false positives)
- **Higher values**: More strict (may miss some phones)
- **Recommended**: 0.5 (balanced)

```python
PHONE_VIOLATION_CLEAR_TIMEOUT = 2.0
```
- **Unit**: Seconds
- **Description**: Time phone must be out of frame before violation clears
- **Recommended**: 2.0 seconds (prevents flickering)

### Person Detection

```python
PERSON_CONFIDENCE_THRESHOLD = 0.6
```
- **Range**: 0.0 to 1.0
- **Description**: Minimum confidence for person detection
- **Recommended**: 0.6 (reduces false positives)

```python
MULTIPLE_PERSON_THRESHOLD = 2
```
- **Description**: Alert when this many or more persons detected
- **Recommended**: 2 (normal = 1 person)

## Gaze Estimation

### Gaze Direction Thresholds

```python
GAZE_LEFT_THRESHOLD = -20.0   # degrees (negative = left)
GAZE_RIGHT_THRESHOLD = 20.0   # degrees (positive = right)
GAZE_CENTER_THRESHOLD = 12.0  # tolerance for "center"
```

**How it works:**
- Gaze angle < `GAZE_LEFT_THRESHOLD` → "left"
- Gaze angle > `GAZE_RIGHT_THRESHOLD` → "right"
- Otherwise → "center" (within `GAZE_CENTER_THRESHOLD`)

**Adjustment:**
- **More sensitive**: Lower absolute values (e.g., -15°, 15°)
- **Less sensitive**: Higher absolute values (e.g., -30°, 30°)

### Gaze Processing

```python
GAZE_SCALING_FACTOR = 100.0
```
- Converts normalized eye offset to degrees
- **Recommended**: 100.0 (calibrated for typical eye geometry)

```python
GAZE_HEAD_YAW_COMP_FACTOR = 0.3
```
- How much head rotation contributes to combined gaze
- **Range**: 0.0 to 1.0
- **Recommended**: 0.3 (balanced)

```python
GAZE_SMOOTHING_WINDOW = 3
```
- Smoothing window size (larger = smoother, slower response)
- **Recommended**: 3 (good balance)

```python
GAZE_MIN_EYE_WIDTH_PX = 12.0
```
- Minimum eye width in pixels to trust gaze estimation
- **Lower values**: Work with smaller faces/farther distances
- **Recommended**: 12.0 pixels

## Blink Detection

### Eye Aspect Ratio (EAR)

```python
BLINK_EAR_THRESHOLD = 0.25
```
- **Range**: 0.0 to 1.0
- **Description**: EAR value below which eye is considered closed
- **Lower values**: More sensitive (detects more blinks)
- **Higher values**: Less sensitive (may miss quick blinks)
- **Recommended**: 0.25 (balanced)

```python
BLINK_CONSECUTIVE_FRAMES = 2
```
- Number of consecutive frames with low EAR to register blink
- **Lower values**: More sensitive
- **Higher values**: Less sensitive
- **Recommended**: 2 frames

## Head Pose Estimation

### Head Pose Ranges

```python
HEAD_YAW_RANGE = (-30, 30)      # Left-right rotation
HEAD_PITCH_RANGE = (-20, 20)    # Up-down tilt
HEAD_ROLL_RANGE = (-15, 15)     # Left-right tilt
```

**How it works:**
- Head pose within these ranges → "facing_screen"
- Outside ranges → "looking_away"

**Adjustment:**
- **More strict**: Smaller ranges (e.g., (-20, 20) for yaw)
- **More lenient**: Larger ranges (e.g., (-45, 45) for yaw)

**Recommended:**
- **Yaw**: (-30, 30) - allows natural head movement
- **Pitch**: (-20, 20) - prevents looking up/down too much
- **Roll**: (-15, 15) - prevents head tilting

## Camera Settings

### Resolution

```python
CAMERA_WIDTH = 640
CAMERA_HEIGHT = 480
```
- **Lower resolution**: Faster processing, lower quality
- **Higher resolution**: Slower processing, better quality
- **Recommended**: 640x480 (good balance)

### Frame Rate

```python
TARGET_FPS = 30
```
- Target frames per second
- Actual FPS depends on processing speed
- **Recommended**: 30 (standard)

```python
CAMERA_INDEX = 0
```
- Camera device index (0 = default webcam)
- Use 1, 2, etc. for additional cameras

## Performance Settings

### Frame Skipping

```python
FRAME_SKIP = 1
```
- Process every Nth frame
- **1** = Process all frames (best quality, slower)
- **2** = Process every other frame (faster, may miss brief violations)
- **Recommended**: 1 (process all frames)

### Processing Time Limit

```python
MAX_FRAME_PROCESSING_TIME_MS = 100
```
- Maximum processing time per frame (milliseconds)
- If exceeded, frame is skipped
- **Lower values**: More frames skipped if slow
- **Higher values**: Allows slower processing
- **Recommended**: 100ms (good balance)

### GPU Acceleration

```python
ENABLE_GPU = False
```
- Enable GPU acceleration (requires CUDA)
- **True**: Use GPU if available (much faster)
- **False**: CPU only (works on all systems)
- **Recommended**: False (unless you have CUDA setup)

## Output Settings

### Frame Transmission

```python
ENABLE_FRAME_TRANSMISSION = False
```
- Send frames as base64 in JSON output
- **True**: Slower, uses more bandwidth, enables video display
- **False**: Faster, JSON only (current implementation)
- **Recommended**: False (status data only)

### JSON Output

```python
JSON_OUTPUT_ENABLED = True
```
- Enable JSON status output to stdout
- **Required**: True (for Node.js integration)
- **Do not change**: Must be True

### Logging

```python
LOG_LEVEL = 'INFO'
```
- Logging verbosity
- Options: 'DEBUG', 'INFO', 'WARNING', 'ERROR'
- **DEBUG**: Very verbose (development)
- **INFO**: Normal operation (recommended)
- **WARNING**: Warnings and errors only
- **ERROR**: Errors only

## Model Paths

### YOLOv8n Model

```python
YOLO_MODEL_PATH = "backend/camera_monitoring/models/yolov8n.pt"
```
- Path to YOLOv8n model file
- Auto-downloads on first use if missing
- **Size**: ~6 MB
- **Do not change**: Unless using custom model

### MediaPipe Model

```python
MEDIAPIPE_MODEL_PATH = None
```
- MediaPipe handles model loading automatically
- **Do not change**: Leave as None

## Violation Detection Settings

### Enable/Disable Features

```python
ENABLE_PHONE_DETECTION = True
ENABLE_PERSON_COUNTING = True
ENABLE_HEAD_POSE_DETECTION = True
ENABLE_GAZE_DETECTION = True
ENABLE_BLINK_DETECTION = True
```

**Usage:**
- Set to `False` to disable specific detection features
- Useful for testing or performance tuning
- **Recommended**: All `True` for full monitoring

## Example: Tuning for Your Environment

### Scenario 1: High False Positive Rate

**Problem**: Too many false phone detections

**Solution**:
```python
PHONE_CONFIDENCE_THRESHOLD = 0.7  # Increase from 0.5
```

### Scenario 2: Missing Quick Glances

**Problem**: Student looking away not detected

**Solution**:
```python
GAZE_LEFT_THRESHOLD = -15.0   # Decrease from -20.0
GAZE_RIGHT_THRESHOLD = 15.0   # Decrease from 20.0
```

### Scenario 3: Too Strict Head Pose

**Problem**: Normal head movement triggers violations

**Solution**:
```python
HEAD_YAW_RANGE = (-45, 45)    # Increase from (-30, 30)
HEAD_PITCH_RANGE = (-30, 30)  # Increase from (-20, 20)
```

### Scenario 4: Low Performance

**Problem**: FPS too low (< 5 FPS)

**Solution**:
```python
FRAME_SKIP = 2                # Process every other frame
CAMERA_WIDTH = 320            # Reduce resolution
CAMERA_HEIGHT = 240
MAX_FRAME_PROCESSING_TIME_MS = 150  # Allow slower processing
```

## Configuration File Location

**File**: `backend/camera_monitoring/config.py`

**To modify:**
1. Open the file in a text editor
2. Change the desired values
3. Save the file
4. Restart the camera monitoring (no need to restart entire app)

## Best Practices

1. **Start with defaults**: Default values work well for most cases
2. **Test incrementally**: Change one setting at a time
3. **Document changes**: Note what you changed and why
4. **Test thoroughly**: Verify changes don't break detection
5. **Monitor performance**: Check FPS after changes

## Advanced: Runtime Configuration

Currently, configuration is static (from `config.py`). For future enhancements:
- Environment variables
- Configuration file (JSON/YAML)
- Runtime API for dynamic changes

---

**Version**: 1.0.0  
**Last Updated**: December 2024

