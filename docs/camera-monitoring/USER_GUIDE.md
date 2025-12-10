# Camera Monitoring Module - User Guide

## Overview

The Camera Monitoring Module is a real-time proctoring system that detects potential exam violations using your webcam. It monitors for mobile phones, multiple persons, improper head/eye movements, and other suspicious behaviors.

## Quick Start

### 1. Setup (First Time Only)

Before using the camera monitoring module, run the setup script:

```bash
npm run setup-camera
```

This will:
- ✅ Check Python 3.9-3.11 installation
- ✅ Install required Python packages
- ✅ Download YOLOv8n model (~6 MB)
- ✅ Verify camera access

**Note**: Setup only needs to be run once. The script will skip steps that are already complete.

### 2. Start the Application

```bash
npm run dev
```

This starts both the React frontend and Electron app.

### 3. Access Camera Test Module

1. Wait for the login screen to appear
2. Click the **"Test Camera Module"** button (below the Login button)
3. The Camera Test Module will open in full-screen

### 4. Start Monitoring

1. Click the green **"Start Monitoring"** button
2. Wait a few seconds for the camera to initialize
3. You should see:
   - Status badge changes to "● Active" (green)
   - Uptime counter starts
   - FPS counter shows frame rate
   - Detection status updates in real-time

## Understanding the Interface

### Status Panel (Left Side)

**Monitoring Status:**
- **Monitoring**: Shows if monitoring is active (● Active / ○ Inactive)
- **Uptime**: How long monitoring has been running
- **FPS**: Frames per second (processing speed)
- **Frames Processed**: Total number of frames analyzed

**Object Detection:**
- **Phone Detected**: ✅ No (green) or ❌ Yes (red)
- **Person Count**: Number of people detected (1 = normal, 0 or 2+ = violation)

**Face Analysis:**
- **Face Detected**: ✅ Yes (green) or ❌ No (red)
- **Facing Screen**: ✅ Yes (green) or ❌ No (red)

**Head Pose:**
- **Yaw**: Left-right head rotation (-90° to +90°)
- **Pitch**: Up-down head tilt (-90° to +90°)
- **Roll**: Head tilt left-right (-90° to +90°)

**Gaze & Blink:**
- **Gaze Direction**: ⬆️ center, ⬅️ left, ➡️ right
- **Blink Detected**: 👀 No or 👁️ Yes
- **EAR Value**: Eye Aspect Ratio (lower = more closed)

### Event Log (Right Side)

The event log shows all detected events with timestamps:

- **🔵 Blue (Info)**: System messages (started, stopped, ready)
- **🟡 Yellow (Warning)**: Minor violations (no face, not facing screen)
- **🔴 Red (Error)**: Major violations (phone detected, multiple persons)

**Actions:**
- Click **"Clear"** to reset the log
- Log automatically keeps last 100 events
- Events are color-coded by severity

### Control Buttons

- **▶️ Start Monitoring**: Begins camera monitoring
- **⏹️ Stop Monitoring**: Stops camera monitoring gracefully
- **Close**: Returns to login screen

## What Gets Detected

### ✅ Normal Behavior (No Violations)
- 1 person in frame
- Face detected and facing screen
- No phone visible
- Gaze direction: center
- Normal blinking

### ❌ Violations Detected

**Phone Detection:**
- Mobile phone appears in camera frame
- Shows confidence percentage
- Violation clears when phone leaves frame

**Multiple Persons:**
- 2 or more people detected in frame
- Indicates potential unauthorized assistance

**Face Not Detected:**
- No face visible in frame
- May indicate student left or camera blocked

**Not Facing Screen:**
- Head pose outside acceptable range
- Student looking away from screen

**Gaze Direction:**
- Looking left or right (away from screen)
- May indicate looking at unauthorized materials

## Performance

**Expected Performance:**
- **FPS**: 9-15 frames per second (varies by hardware)
- **Processing Time**: ~100-200ms per frame
- **Memory Usage**: ~500MB-1GB
- **CPU Usage**: 30-50% (varies by hardware)

**Note**: Performance depends on your hardware. Lower-end systems may see slightly lower FPS, but detection accuracy remains the same.

## Troubleshooting

### Camera Not Working

**Issue**: "Camera access denied" or camera not opening

**Solutions:**
1. Check Windows camera permissions:
   - Settings → Privacy → Camera
   - Ensure "Allow apps to access your camera" is ON
2. Close other applications using the camera (Zoom, Teams, etc.)
3. Restart the application
4. Try disconnecting and reconnecting the camera

### No Detection Updates

**Issue**: Status panel shows "Waiting for data..." or values not updating

**Solutions:**
1. Ensure you're facing the camera
2. Check lighting (face should be clearly visible)
3. Ensure camera is not blocked
4. Check terminal for Python errors
5. Try stopping and restarting monitoring

### Low FPS

**Issue**: FPS is very low (< 5 FPS)

**Solutions:**
1. Close other applications to free CPU
2. Reduce camera resolution in `config.py` (if needed)
3. This is normal on lower-end hardware - detection still works

### Python Errors

**Issue**: Errors in terminal about Python modules

**Solutions:**
1. Run setup again: `npm run setup-camera`
2. Verify Python version: `py -3.11 --version`
3. Reinstall dependencies: `py -3.11 -m pip install -r python_requirements.txt`

## Best Practices

### For Testing
1. **Good Lighting**: Ensure face is well-lit
2. **Camera Position**: Position camera at eye level
3. **Distance**: Sit 2-3 feet from camera
4. **Background**: Use a plain background for better detection

### For Production Use
1. **Privacy**: Inform students that camera monitoring is active
2. **Performance**: Test on target hardware before deployment
3. **Configuration**: Adjust thresholds in `config.py` based on testing
4. **Monitoring**: Review violation logs regularly

## Configuration

Edit `backend/camera_monitoring/config.py` to customize:

**Detection Thresholds:**
```python
PHONE_CONFIDENCE_THRESHOLD = 0.5  # Phone detection confidence
MULTIPLE_PERSON_THRESHOLD = 2     # Alert if 2+ persons
```

**Head Pose Ranges:**
```python
HEAD_YAW_RANGE = (-30, 30)        # Left-right head rotation
HEAD_PITCH_RANGE = (-20, 20)      # Up-down head tilt
```

**Gaze Thresholds:**
```python
GAZE_LEFT_THRESHOLD = -15         # Looking left threshold
GAZE_RIGHT_THRESHOLD = 15          # Looking right threshold
```

**Blink Detection:**
```python
BLINK_EAR_THRESHOLD = 0.25        # Eye Aspect Ratio for blink
```

**Performance:**
```python
FRAME_SKIP = 1                    # Process every Nth frame (1 = all)
MAX_FRAME_PROCESSING_TIME_MS = 100 # Skip frame if processing too slow
```

## API Reference

### Frontend API (TypeScript)

```typescript
// Start monitoring
await window.electronAPI.camera.startTest({ debug: true });

// Stop monitoring
await window.electronAPI.camera.stopTest();

// Get current status
const status = await window.electronAPI.camera.getStatus();

// Listen for status updates
const unsubscribe = window.electronAPI.camera.onStatusUpdate((status) => {
  console.log('Status:', status);
});

// Listen for errors
const unsubscribeError = window.electronAPI.camera.onError((error) => {
  console.error('Error:', error);
});
```

### Status Data Structure

```typescript
interface CameraStatus {
  timestamp: number;
  fps: number;
  frame_number: number;
  detections: {
    phone: {
      detected: boolean;
      confidence: number;
      bbox: number[] | null;
    };
    persons: {
      count: number;
      bboxes: number[][];
    };
  };
  face: {
    detected: boolean;
    head_pose?: {
      yaw: number;
      pitch: number;
      roll: number;
    };
    orientation?: 'facing_screen' | 'looking_away';
  };
  gaze: {
    direction: 'center' | 'left' | 'right';
    looking_at_screen: boolean;
  };
  blink: {
    is_blinking: boolean;
    avg_ear: number;
  };
  violations: {
    phone_violation: boolean;
    multiple_persons: boolean;
    no_face_detected: boolean;
    not_facing_screen: boolean;
    not_looking_at_screen: boolean;
  };
}
```

## Support

For technical issues:
1. Check the terminal output for error messages
2. Review `docs/camera-monitoring/TESTING_GUIDE.md`
3. Check `docs/camera-monitoring/TASKS.md` for implementation status

---

**Version**: 1.0.0  
**Last Updated**: December 2024

