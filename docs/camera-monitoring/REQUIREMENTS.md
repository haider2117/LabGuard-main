# Camera-Based Monitoring Module - Requirements Document

## Overview

This document specifies the functional and non-functional requirements for the camera-based monitoring module in LabGuard. The module will detect violations during exams using computer vision and machine learning.

## Functional Requirements

### FR1: Mobile Phone Detection
**Priority**: High

**Description**: The system must detect mobile phones in the camera frame during exam monitoring.

**Acceptance Criteria**:
- ✅ Detect mobile phones with confidence ≥ 0.5
- ✅ Display bounding box around detected phone
- ✅ Log phone detection events with timestamp
- ✅ Support real-time detection at ≥ 20 FPS
- ✅ Handle multiple phones in frame
- ✅ Distinguish phones from other rectangular objects

**Violation Logic**:
- Phone detected = Violation
- Violation persists while phone remains in frame
- Violation clears when phone leaves frame for > 2 seconds

---

### FR2: Person Counting
**Priority**: High

**Description**: The system must count the number of persons visible in the camera frame.

**Acceptance Criteria**:
- ✅ Detect all persons in frame
- ✅ Count persons accurately (1, 2, 3+)
- ✅ Display person count in real-time
- ✅ Log person count changes with timestamp
- ✅ Handle partial visibility (person partially out of frame)

**Violation Logic**:
- 1 person = Normal (expected)
- 2+ persons = Violation (multiple people in frame)
- 0 persons = Warning (student left frame)

---

### FR3: Head Pose Estimation
**Priority**: High

**Description**: The system must estimate the student's head orientation (yaw, pitch, roll).

**Acceptance Criteria**:
- ✅ Calculate head pose angles (yaw, pitch, roll) in degrees
- ✅ Accuracy: ±5 degrees for yaw, ±3 degrees for pitch/roll
- ✅ Update pose estimation at ≥ 20 FPS
- ✅ Display head pose indicators in UI
- ✅ Log head pose changes

**Pose Ranges**:
- **Yaw** (left-right): -90° to +90°
- **Pitch** (up-down): -45° to +45°
- **Roll** (tilt): -30° to +30°

**Violation Logic**:
- Head facing screen: Yaw ∈ [-30°, 30°], Pitch ∈ [-35°, 20°] (expanded downward for typing scenarios)
- Head not facing screen = Violation (looking away)

---

### FR4: Gaze Direction Estimation
**Priority**: High

**Description**: The system must estimate where the student is looking (left, center, right).

**Acceptance Criteria**:
- ✅ Determine gaze direction (left/center/right)
- ✅ Calculate horizontal gaze angle
- ✅ Update gaze estimation at ≥ 20 FPS
- ✅ Display gaze direction indicator
- ✅ Log gaze direction changes

**Gaze Classification** (as implemented):
- **Left**: Horizontal angle < -20° (extreme left)
- **Center**: Horizontal angle ∈ [-12°, 12°] (looking at screen)
- **Right**: Horizontal angle > 20° (extreme right)
- **Note**: Values tuned for stability (reduces false fluctuations between left/center/right)

**Violation Logic**:
- Gaze center = Normal (looking at screen)
- Gaze left/right for > 3 seconds = Violation (not looking at screen)

---

### FR5: Blink Detection
**Priority**: Medium

**Description**: The system must detect eye blinks to monitor student attention.

**Acceptance Criteria**:
- ✅ Detect blinks using Eye Aspect Ratio (EAR)
- ✅ Calculate EAR for both eyes
- ✅ Distinguish blinks from closed eyes
- ✅ Count blinks per minute
- ✅ Log blink events

**Blink Detection**:
- EAR < 0.25 = Eye closed
- Blink = Eye closed for 2-5 frames
- Closed eye > 5 frames = Eyes closed (not a blink)

**Metrics**:
- Normal blink rate: 15-20 blinks/minute
- Low blink rate (< 10/min) = Possible fatigue
- High blink rate (> 30/min) = Possible stress

---

### FR6: Test Camera Module UI
**Priority**: High

**Description**: A test interface must be available on the login screen to test the camera monitoring module without logging in.

**Acceptance Criteria**:
- ✅ "Test Camera Module" button on login screen
- ✅ Button always visible (for development/testing)
- ✅ Opens camera feed in modal/separate view
- ✅ Displays real-time detection overlays
- ✅ Shows status panel with all metrics
- ✅ Displays violation log
- ✅ Start/Stop monitoring controls
- ✅ Error messages for camera access issues

**UI Components**:
- Video display area (640x480 or larger)
- Overlay canvas (bounding boxes, indicators)
- Status panel (phone, persons, gaze, pose, blinks)
- Violation log (scrollable list with timestamps)
- Control buttons (Start, Stop, Settings)

---

### FR7: Real-Time Status Updates
**Priority**: High

**Description**: The system must provide real-time status updates to the UI.

**Acceptance Criteria**:
- ✅ Update UI at ≥ 20 FPS
- ✅ Display current detection status
- ✅ Show FPS counter
- ✅ Update violation log in real-time
- ✅ Smooth overlay rendering (no flickering)

**Update Frequency**:
- Status updates: Every frame (~30 FPS)
- UI refresh: Throttled to 20-30 FPS
- Log updates: On violation state change

---

### FR8: Violation Logging
**Priority**: High

**Description**: The system must log all violations with timestamps for review.

**Acceptance Criteria**:
- ✅ Log phone detection events
- ✅ Log multiple person events
- ✅ Log gaze violations (looking away)
- ✅ Log head pose violations (not facing screen)
- ✅ Include timestamp for each event
- ✅ Include duration for persistent violations
- ✅ Clear log when monitoring stops

**Log Format**:
```
[Timestamp] [Violation Type] [Details]
Example: [2024-01-15 14:30:25] Phone Detected - Confidence: 0.87
Example: [2024-01-15 14:30:28] Multiple Persons - Count: 2
Example: [2024-01-15 14:30:30] Not Looking at Screen - Gaze: Left
```

---

### FR9: Error Handling
**Priority**: High

**Description**: The system must handle errors gracefully without crashing.

**Acceptance Criteria**:
- ✅ Handle camera access denied errors
- ✅ Handle model loading failures
- ✅ Handle Python process crashes
- ✅ Handle IPC communication failures
- ✅ Display user-friendly error messages
- ✅ Allow recovery from errors

**Error Scenarios**:
- Camera already in use → Show error, suggest closing other apps
- Camera permission denied → Show permission request message
- Model file missing → Show download/install instructions
- Python not installed → Show installation instructions
- Python process crash → Auto-restart (max 3 attempts)

---

### FR10: Performance Requirements
**Priority**: High

**Description**: The system must run efficiently on typical Windows laptops.

**Acceptance Criteria**:
- ✅ Process frames at ≥ 20 FPS on CPU-only
- ✅ Use < 50% CPU on quad-core processor
- ✅ Use < 2 GB RAM
- ✅ Start monitoring within 5 seconds
- ✅ Stop monitoring within 2 seconds

**Target Hardware**:
- CPU: Intel i5/i7 (4+ cores) or AMD equivalent
- RAM: 8 GB minimum
- Camera: 720p or 1080p webcam
- OS: Windows 10/11

---

## Non-Functional Requirements

### NFR1: Accuracy
**Priority**: High

**Requirements**:
- Phone detection: ≥ 85% accuracy (true positive rate)
- Person counting: ≥ 90% accuracy
- Head pose: ±5° accuracy for yaw, ±3° for pitch/roll
- Gaze direction: ≥ 80% accuracy (left/center/right classification)
- Blink detection: ≥ 90% accuracy

**Testing**: Validate against test dataset with ground truth annotations.

---

### NFR2: Performance
**Priority**: High

**Requirements**:
- Frame processing: ≥ 20 FPS on CPU
- End-to-end latency: < 100ms (camera → UI update)
- Memory usage: < 2 GB
- CPU usage: < 50% on quad-core processor
- Startup time: < 5 seconds

**Measurement**: Profile with real webcam on target hardware.

---

### NFR3: Resource Usage
**Priority**: Medium

**Requirements**:
- Bundle size increase: < 250 MB
- Model files: < 25 MB total
- Python runtime: < 100 MB (if embedded)
- Disk space: < 500 MB for all dependencies

**Optimization**: Use lightweight models, compress where possible.

---

### NFR4: Reliability
**Priority**: High

**Requirements**:
- Uptime: 99% during exam session
- Crash recovery: Auto-restart within 5 seconds
- Error rate: < 1% false positives for violations
- Data loss: Zero (all violations logged)

**Testing**: Stress test with 4-hour continuous monitoring.

---

### NFR5: Usability
**Priority**: Medium

**Requirements**:
- UI responsiveness: No lag or freezing
- Clear error messages: User-friendly, actionable
- Visual feedback: Clear overlays and indicators
- Settings: Adjustable thresholds (optional)

**Testing**: User acceptance testing with 5+ test users.

---

### NFR6: Compatibility
**Priority**: High

**Requirements**:
- Windows 10/11 compatibility
- Common webcam brands (Logitech, Microsoft, etc.)
- Python 3.9-3.11 support
- Electron 38+ compatibility

**Testing**: Test on multiple Windows versions and webcam models.

---

### NFR7: Security & Privacy
**Priority**: High

**Requirements**:
- No frame storage (unless violation detected)
- Camera access: Explicit permission request
- Data privacy: No transmission to external servers
- Process isolation: Python runs in separate process

**Compliance**: Follow LabGuard security policies.

---

### NFR8: Maintainability
**Priority**: Medium

**Requirements**:
- Code documentation: All functions documented
- Modular design: Easy to replace components
- Configuration: Externalized in config files
- Logging: Comprehensive error and debug logs

**Standards**: Follow existing LabGuard code style.

---

## Constraints

### C1: CPU-Only Processing
- No GPU/CUDA required (must work on typical laptops)
- Models must be optimized for CPU inference
- Performance targets must be achievable on CPU

### C2: Windows Platform
- Primary target: Windows 10/11
- Linux/Mac support: Not required for MVP
- Windows-specific APIs acceptable

### C3: Lightweight Models
- Total model size: < 25 MB
- Fast inference: ≥ 20 FPS on CPU
- Accuracy: Sufficient for proctoring (not medical-grade)

### C4: Development Phase
- Test button always visible (for development)
- Production integration: Future phase
- Database logging: Future phase

### C5: Python Runtime
- Python must be bundled or easily installable
- No system Python dependency (if possible)
- Embedded Python preferred for distribution

---

## Out of Scope (Future Enhancements)

The following features are **NOT** required for the initial implementation:

1. ❌ GPU/CUDA acceleration
2. ❌ Advanced gaze models (ETH-XGaze, etc.)
3. ❌ Behavioral pattern analysis
4. ❌ Audio detection (speech/conversations)
5. ❌ OCR on phone screens
6. ❌ Multi-camera support
7. ❌ Video recording
8. ❌ Cloud sync
9. ❌ Real-time alerts/notifications
10. ❌ Integration with exam monitoring (Phase 2)
11. ❌ Database logging (Phase 2)
12. ❌ Teacher violation reports (Phase 2)

---

## Success Criteria

The camera monitoring module is considered successful if:

1. ✅ All functional requirements (FR1-FR10) are met
2. ✅ Performance targets (NFR2) are achieved on target hardware
3. ✅ Accuracy targets (NFR1) are met for all detections
4. ✅ Test UI is functional and user-friendly
5. ✅ Error handling works for all identified scenarios
6. ✅ Code is documented and maintainable
7. ✅ Module can be easily integrated into exam flow (Phase 2)

---

## Dependencies

### External Dependencies
- Python 3.9-3.11 runtime
- OpenCV library
- MediaPipe library
- Ultralytics YOLOv8
- NumPy, Pillow

### Internal Dependencies
- Electron main process (IPC)
- React frontend framework
- Existing LabGuard authentication system (for future integration)

---

## Assumptions

1. **Hardware**: Students have webcams on their computers
2. **Lighting**: Adequate lighting for face detection
3. **Camera Position**: Webcam is positioned to capture student's face
4. **Privacy**: Students consent to camera monitoring during exams
5. **Performance**: Target hardware meets minimum specs (i5, 8GB RAM)

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Camera access denied | High | Medium | Clear error messages, permission request UI |
| Low FPS on older hardware | Medium | Medium | Frame skipping, lower resolution, configurable settings |
| False positive detections | Medium | Low | Tune thresholds, add confirmation logic |
| Python process crashes | High | Low | Auto-restart, error recovery, graceful degradation |
| Model loading failures | High | Low | Validate model files, provide download script |
| Privacy concerns | High | Low | Clear consent, no frame storage, transparent logging |

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-15 | 1.0 | Initial requirements document | LabGuard Team |
| 2024-12-09 | 1.1 | Updated gaze thresholds and head pose ranges to match implementation values. Gaze: -20°/12°/20° (left/center/right), Head pose pitch: -35° to 20° (expanded for typing scenarios). | AI Assistant |

