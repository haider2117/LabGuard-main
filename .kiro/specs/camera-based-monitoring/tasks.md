# Implementation Plan: Camera-Based Monitoring System

This implementation plan breaks down the camera-based monitoring feature into discrete, actionable coding tasks. Each task builds incrementally on previous work, following test-driven development principles where appropriate. Tasks are ordered to validate core functionality early and ensure continuous integration.

---

## Tasks

- [ ] 1. Set up Python backend structure and dependencies
  - Create directory structure: `backend/services/cameraMonitoring/`
  - Create `requirements.txt` with dependencies: opencv-python, mediapipe, ultralytics, numpy
  - Create `__init__.py` to make it a Python package
  - Create `config.json` with default configuration values for thresholds and camera settings
  - _Requirements: 9.6, 12.1, 12.5_

- [ ] 2. Implement configuration loader
  - Create `config_loader.py` with `ConfigLoader` class
  - Implement `load_config()` method to read and parse `config.json`
  - Implement validation for configuration values with fallback to defaults
  - Implement `get_default_config()` method that returns default configuration dictionary
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 3. Implement YOLO detector module
  - Create `yolo_detector.py` with `YOLODetector` class
  - Implement `__init__()` to load YOLOv8n model from ultralytics
  - Implement `detect()` method that takes frame and returns detections for "person" and "cell phone" classes
  - Implement `BoundingBox` and `DetectionResult` data classes
  - Filter detections by confidence threshold from config
  - _Requirements: 1.1, 1.5, 2.1, 2.6, 9.6_

- [ ]* 3.1 Write unit tests for YOLO detector
  - Create `test_yolo_detector.py` with sample test images
  - Test phone detection with image containing phone
  - Test person detection with image containing people
  - Test confidence threshold filtering
  - _Requirements: 1.1, 2.1_

- [ ] 4. Implement MediaPipe face analyzer module
  - Create `face_analyzer.py` with `FaceAnalyzer` class
  - Implement `__init__()` to initialize MediaPipe Face Mesh
  - Implement `analyze()` method that detects face and extracts 468 landmarks
  - Implement iris landmark extraction for both eyes
  - Implement `FaceAnalysisResult`, `GazeDirection`, and `HeadPose` data classes
  - _Requirements: 3.1, 3.2, 3.6_

- [ ] 5. Implement gaze direction estimation
  - In `face_analyzer.py`, implement `_calculate_gaze_direction()` method
  - Use iris landmarks to determine if looking LEFT, RIGHT, CENTER, UP, DOWN
  - Calculate iris position relative to eye corners
  - Return UNKNOWN if iris landmarks not visible
  - _Requirements: 4.1, 4.2, 4.6_

- [ ] 6. Implement head pose estimation
  - In `face_analyzer.py`, implement `_calculate_head_pose()` method
  - Use solvePnP with 3D face model and 2D landmarks to get rotation vectors
  - Convert rotation vectors to Euler angles (pitch, yaw, roll)
  - Return `HeadPose` object with angles in degrees
  - _Requirements: 5.1_

- [ ] 7. Implement blink detection
  - In `face_analyzer.py`, implement `_detect_blink()` method
  - Calculate Eye Aspect Ratio (EAR) for both eyes using landmark distances
  - Compare EAR against threshold from config (default 0.2)
  - Return boolean indicating if blink detected
  - _Requirements: 6.1, 6.2_

- [ ]* 7.1 Write unit tests for face analyzer
  - Create `test_face_analyzer.py` with sample face images
  - Test face detection with frontal face image
  - Test gaze estimation with images of person looking different directions
  - Test head pose with images of head at different angles
  - Test blink detection with eyes open and closed images
  - _Requirements: 3.1, 4.1, 5.1, 6.1_

- [ ] 8. Implement violation engine
  - Create `violation_engine.py` with `ViolationEngine` class
  - Implement `__init__()` to load thresholds from config
  - Implement `Violation`, `ViolationType`, and `Severity` data classes
  - Implement state tracking for time-based violations (gaze away duration, no blink duration)
  - Implement `update()` method that takes detection results and returns list of active violations
  - Implement violation logic for: phone detected, no person, multiple persons, face not visible, suspicious gaze, head turned away, head tilted, no blink
  - Implement `get_active_violations()` and `reset()` methods
  - _Requirements: 1.3, 2.2, 2.3, 3.3, 4.3, 5.2, 5.3, 6.3_

- [ ]* 8.1 Write unit tests for violation engine
  - Create `test_violation_engine.py` with mock detection data
  - Test phone detection violation triggering
  - Test person count violations (0 and >1 persons)
  - Test gaze away duration threshold
  - Test head pose angle thresholds
  - Test no blink duration threshold
  - Test violation flag clearing when conditions resolve
  - _Requirements: 1.3, 2.2, 2.3, 4.3, 5.2, 6.3_

- [ ] 9. Implement event logger
  - Create `event_logger.py` with `EventLogger` class
  - Implement `__init__()` to create log file with session ID and timestamp
  - Implement `Event` data class with timestamp, frame number, event type, and data
  - Implement `log_event()` method to append events to in-memory list
  - Implement `log_violation()` method for violation-specific logging
  - Implement `close()` method to write complete log to JSON file with session summary
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ]* 9.1 Write unit tests for event logger
  - Create `test_event_logger.py`
  - Test log file creation with correct naming
  - Test event logging with various event types
  - Test JSON output format validation
  - Test session summary generation
  - _Requirements: 10.1, 10.2, 10.6_

- [ ] 10. Implement frame renderer
  - Create `frame_renderer.py` with `FrameRenderer` class
  - Implement `render()` method that takes frame, detections, and violations
  - Implement `draw_bounding_boxes()` for YOLO detections (phones in red, persons in green)
  - Implement `draw_face_landmarks()` to draw 468 landmark points
  - Implement `draw_gaze_indicator()` to show arrow or text for gaze direction
  - Implement `draw_head_pose()` to show 3D axis or angle text
  - Implement `draw_violations()` to display violation warnings in red text
  - Implement FPS counter display
  - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 11. Implement main camera service
  - Create `camera_service.py` with `CameraMonitoringService` class
  - Implement `__init__()` to initialize all components (YOLO, MediaPipe, ViolationEngine, EventLogger, FrameRenderer)
  - Implement webcam initialization with OpenCV using camera index from config
  - Implement `start_monitoring()` method that begins the frame processing loop
  - Implement `process_frame()` method that coordinates all detections and returns results
  - Implement frame capture with error handling and retry logic
  - Implement `stop_monitoring()` method to clean up resources
  - _Requirements: 9.1, 9.2, 9.3, 11.1, 11.2_

- [ ] 12. Implement frame processing loop with error handling
  - In `camera_service.py`, implement main processing loop in `start_monitoring()`
  - Capture frame from webcam
  - Run YOLO detection on frame
  - Run MediaPipe face analysis on frame
  - Update violation engine with detection results
  - Log events and violations
  - Render overlays on frame
  - Display frame in OpenCV window
  - Calculate and display FPS
  - Handle keyboard input ('q' or ESC to exit)
  - Implement frame skip logic if processing exceeds 100ms
  - _Requirements: 7.1, 7.7, 9.4, 11.3, 11.4, 11.5_

- [ ] 13. Implement graceful error handling and degradation
  - In `camera_service.py`, add try-catch blocks for each detection component
  - Implement fallback logic: if YOLO fails, continue with MediaPipe only
  - Implement fallback logic: if MediaPipe fails, continue with YOLO only
  - Implement webcam retry logic (3 attempts with 1-second delay)
  - Implement error logging for all failure scenarios
  - Implement `send_event()` method to output events to stdout for IPC
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 14. Create Python entry point script
  - Create `main.py` as entry point for camera monitoring service
  - Parse command-line arguments for config file path
  - Initialize `CameraMonitoringService` with config
  - Call `start_monitoring()` and handle KeyboardInterrupt
  - Output events to stdout in JSON format for Electron IPC
  - Handle cleanup on exit
  - _Requirements: 9.1, 10.2_

- [ ]* 14.1 Test Python service standalone
  - Run `main.py` directly to test camera monitoring without Electron
  - Verify webcam opens and displays feed
  - Verify all detections work (phone, person, face, gaze, head pose, blink)
  - Verify overlays display correctly
  - Verify log file is created
  - Verify pressing 'q' exits cleanly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.2, 10.3_

- [ ] 15. Implement Electron IPC bridge
  - Create `backend/services/cameraMonitoringBridge.js` with `CameraMonitoringBridge` class
  - Implement `startMonitoring()` method to spawn Python process using `child_process.spawn`
  - Implement stdout parsing to capture JSON events from Python
  - Implement `stopMonitoring()` method to terminate Python process gracefully
  - Implement event forwarding to renderer process via `webContents.send()`
  - Implement error handling for process spawn failures and crashes
  - Define IPC event names: 'camera-monitoring-started', 'camera-monitoring-stopped', 'camera-monitoring-event', 'camera-monitoring-violation', 'camera-monitoring-error'
  - _Requirements: 8.2, 8.3, 11.1_

- [ ] 16. Register IPC handlers in Electron main process
  - In `backend/app/main.js`, import `CameraMonitoringBridge`
  - Register IPC handler for 'start-camera-monitoring' that calls `bridge.startMonitoring()`
  - Register IPC handler for 'stop-camera-monitoring' that calls `bridge.stopMonitoring()`
  - Forward events from bridge to renderer process
  - Handle bridge errors and send to renderer
  - _Requirements: 8.2, 8.3_

- [ ] 17. Create React TestCameraModule component
  - Create `frontend/src/components/TestCameraModule.tsx`
  - Implement component state for monitoring status, events, violations, and stats
  - Implement `startMonitoring()` method that sends 'start-camera-monitoring' IPC message
  - Implement `stopMonitoring()` method that sends 'stop-camera-monitoring' IPC message
  - Implement IPC event listeners for camera monitoring events
  - Implement UI layout with event log panel and violation summary
  - Implement "Start Monitoring" and "Stop Monitoring" buttons
  - Implement "Close" button to return to login screen
  - _Requirements: 8.1, 8.4, 8.5, 8.6_

- [ ] 18. Style TestCameraModule component
  - Create `frontend/src/components/TestCameraModule.css`
  - Style the test module layout with split view (log panel + stats panel)
  - Style event log with scrollable list and color-coded event types
  - Style violation summary with severity indicators (warning = yellow, violation = red)
  - Style control buttons (Start, Stop, Close)
  - Ensure responsive design and readability
  - _Requirements: 8.5_

- [ ] 19. Update Login component with test button
  - Open `frontend/src/components/Login.tsx`
  - Add state for showing TestCameraModule
  - Add "Test Camera Module" button below login form
  - Implement button click handler to show TestCameraModule component
  - Conditionally render TestCameraModule when active
  - Add feature flag or environment check to show button only in development
  - _Requirements: 8.1, 8.2_

- [ ] 20. Update Login component styles
  - Open `frontend/src/components/Login.css`
  - Add styles for "Test Camera Module" button
  - Position button appropriately on login screen
  - Add hover and active states for button
  - _Requirements: 8.1_

- [ ] 21. Add TypeScript type definitions
  - Create `frontend/src/types/cameraMonitoring.ts`
  - Define interfaces for: `FrameData`, `BoundingBox`, `FaceData`, `Violation`, `CameraMonitoringConfig`, `Event`
  - Export all types for use in components
  - _Requirements: 8.4, 8.5_

- [ ] 22. Update Electron preload script
  - Open `backend/app/preload.js`
  - Expose camera monitoring IPC methods to renderer: `startCameraMonitoring()`, `stopCameraMonitoring()`
  - Expose event listeners: `onCameraMonitoringEvent()`, `onCameraMonitoringViolation()`, `onCameraMonitoringError()`
  - Update TypeScript definitions in `frontend/src/types/electron.d.ts`
  - _Requirements: 8.2, 8.3_

- [ ] 23. Implement model download script
  - Create `backend/services/cameraMonitoring/download_models.py`
  - Implement function to download YOLOv8n model using ultralytics API
  - MediaPipe models download automatically on first use
  - Verify model files exist and have correct checksums
  - Integrate into `npm run download-models` script
  - _Requirements: 9.6, 9.7_

- [ ] 24. Create default configuration file
  - Create `backend/services/cameraMonitoring/config.json` with all default values
  - Set camera defaults: index=0, width=640, height=480, targetFps=30
  - Set detection thresholds: phone=0.5, person=0.5
  - Set violation thresholds: gazeAwayDuration=3.0, headYaw=45, headPitch=30, blinkEAR=0.2, noBlinkDuration=10.0
  - Set display options: enableOverlays=true, showFps=true, showLandmarks=true
  - Set logging options: enabled=true, logDirectory="./logs"
  - _Requirements: 12.1, 12.7_

- [ ] 25. Add Python dependencies to package.json
  - Update `package.json` to include Python dependency installation
  - Add script to install Python packages: `pip install -r backend/services/cameraMonitoring/requirements.txt`
  - Update `postinstall` script to run Python dependency installation
  - Document Python 3.9+ requirement in README
  - _Requirements: 9.6_

- [ ]* 26. Create integration test
  - Create `backend/services/cameraMonitoring/test_integration.py`
  - Test full pipeline with recorded video file instead of live webcam
  - Verify all components work together
  - Verify log file is created with correct format
  - Verify events are logged correctly
  - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 10.3_

- [ ] 27. Add error boundary to React component
  - Wrap TestCameraModule with React error boundary
  - Display user-friendly error message if component crashes
  - Log errors to console for debugging
  - Provide "Retry" button to restart monitoring
  - _Requirements: 11.6, 11.7_

- [ ] 28. Implement performance monitoring
  - In `camera_service.py`, track frame processing time
  - Calculate rolling average FPS over last 30 frames
  - Log warning if FPS drops below 15
  - Log warning if CPU usage exceeds threshold (if measurable)
  - Display performance stats in test UI
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 29. Add documentation
  - Create `backend/services/cameraMonitoring/README.md`
  - Document architecture and component responsibilities
  - Document configuration options
  - Document how to run standalone Python service for testing
  - Document IPC event format
  - Document log file format
  - Add code comments to all major functions
  - _Requirements: All_

- [ ] 30. Final integration testing and bug fixes
  - Test complete flow: Login screen → Test Camera Module → Monitoring → Close
  - Test with real scenarios: phone detection, multiple people, gaze tracking, head movement
  - Test error scenarios: cover webcam, disconnect camera, kill Python process
  - Test performance on target hardware (dual-core laptop)
  - Fix any bugs discovered during testing
  - Verify log files are created correctly
  - Verify all violations trigger correctly with proper thresholds
  - _Requirements: All_

---

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for MVP
- Each task should be completed and verified before moving to the next
- The Python service can be tested standalone before integrating with Electron
- Configuration values can be tuned after initial implementation based on testing
- The "Test Camera Module" button should be hidden or removed before production release
