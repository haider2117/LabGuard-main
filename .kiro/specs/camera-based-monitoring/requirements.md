# Requirements Document

## Introduction

The Camera-Based Monitoring feature is a lightweight, real-time proctoring system for the LabGuard desktop application. This feature monitors students during exams by analyzing webcam feeds to detect potential cheating behaviors including mobile phone usage, multiple people in frame, improper gaze direction, and suspicious head movements. The system is designed to run efficiently on CPU-only Windows laptops with minimal resource usage while maintaining real-time performance.

The monitoring system uses YOLOv8n for object detection (mobile phones and people) and MediaPipe Face Mesh for facial analysis (face detection, landmarks, gaze estimation, head pose, and blink detection). All detections are processed locally without requiring internet connectivity during exam sessions.

## Requirements

### Requirement 1: Mobile Phone Detection

**User Story:** As a proctor, I want the system to detect when a student has a mobile phone visible in the camera frame, so that I can identify potential cheating attempts.

#### Acceptance Criteria

1. WHEN a mobile phone appears in the webcam frame THEN the system SHALL detect it within 100ms
2. WHEN a mobile phone is detected THEN the system SHALL draw a bounding box around it with a "Phone Detected" label
3. WHEN a mobile phone is detected THEN the system SHALL set a violation flag to true
4. WHEN the mobile phone is removed from frame THEN the system SHALL clear the violation flag within 100ms
5. IF the detection confidence is below 0.5 THEN the system SHALL NOT report a phone detection
6. WHEN a phone is detected THEN the system SHALL log the timestamp and detection confidence

### Requirement 2: Person Count Detection

**User Story:** As a proctor, I want the system to ensure exactly one person is visible in the camera frame, so that I can prevent unauthorized assistance during exams.

#### Acceptance Criteria

1. WHEN the webcam feed is active THEN the system SHALL continuously count the number of people in frame
2. WHEN zero people are detected THEN the system SHALL set a "No Person Detected" violation flag
3. WHEN more than one person is detected THEN the system SHALL set a "Multiple Persons Detected" violation flag
4. WHEN exactly one person is detected THEN the system SHALL clear all person-count violation flags
5. WHEN multiple people are detected THEN the system SHALL draw bounding boxes around each detected person
6. IF the detection confidence is below 0.5 THEN the system SHALL NOT count that detection
7. WHEN person count changes THEN the system SHALL log the timestamp and new count

### Requirement 3: Face Detection and Tracking

**User Story:** As a proctor, I want the system to detect and track the student's face continuously, so that facial analysis features can function properly.

#### Acceptance Criteria

1. WHEN a person is in frame THEN the system SHALL detect their face within 50ms
2. WHEN a face is detected THEN the system SHALL extract 468 facial landmarks
3. WHEN no face is detected for more than 2 seconds THEN the system SHALL set a "Face Not Visible" violation flag
4. WHEN a face is detected after being absent THEN the system SHALL clear the "Face Not Visible" violation flag
5. WHEN a face is detected THEN the system SHALL draw facial landmark overlays on the video feed
6. WHEN multiple faces are detected THEN the system SHALL track the largest/closest face

### Requirement 4: Gaze Direction Estimation

**User Story:** As a proctor, I want the system to estimate where the student is looking, so that I can detect if they are looking away from their screen at unauthorized materials.

#### Acceptance Criteria

1. WHEN a face with visible eyes is detected THEN the system SHALL estimate gaze direction within 20ms
2. WHEN gaze direction is estimated THEN the system SHALL classify it as LEFT, RIGHT, CENTER, UP, or DOWN
3. WHEN the student looks away from center for more than 3 consecutive seconds THEN the system SHALL set a "Suspicious Gaze" warning flag
4. WHEN the student returns gaze to center THEN the system SHALL clear the "Suspicious Gaze" warning flag
5. WHEN gaze direction changes THEN the system SHALL display the current direction as text overlay on the video feed
6. WHEN iris landmarks are not visible THEN the system SHALL report "Gaze Unknown" status
7. WHEN gaze direction is estimated THEN the system SHALL log the direction and timestamp

### Requirement 5: Head Pose Estimation

**User Story:** As a proctor, I want the system to track the student's head orientation, so that I can detect if they are turning away from the screen or looking at unauthorized materials.

#### Acceptance Criteria

1. WHEN facial landmarks are detected THEN the system SHALL calculate head pose angles (pitch, yaw, roll) within 10ms
2. WHEN head yaw exceeds ±45 degrees THEN the system SHALL set a "Head Turned Away" violation flag
3. WHEN head pitch exceeds ±30 degrees THEN the system SHALL set a "Head Tilted Excessively" warning flag
4. WHEN head returns to acceptable range THEN the system SHALL clear the respective violation flags
5. WHEN head pose is calculated THEN the system SHALL display orientation indicators on the video feed
6. WHEN head pose angles are calculated THEN the system SHALL log the angles and timestamp

### Requirement 6: Blink Detection

**User Story:** As a proctor, I want the system to detect eye blinks, so that I can verify a live person is present and not a static photo or video.

#### Acceptance Criteria

1. WHEN eyes are visible THEN the system SHALL calculate Eye Aspect Ratio (EAR) for both eyes
2. WHEN EAR drops below 0.2 THEN the system SHALL register a blink event
3. WHEN no blinks are detected for more than 10 seconds THEN the system SHALL set a "No Blink Detected" warning flag
4. WHEN a blink is detected after a warning THEN the system SHALL clear the "No Blink Detected" warning flag
5. WHEN blinks are detected THEN the system SHALL display blink count on the video feed
6. WHEN a blink occurs THEN the system SHALL log the timestamp

### Requirement 7: Real-Time Video Display with Overlays

**User Story:** As a developer testing the monitoring system, I want to see the live camera feed with visual overlays showing all detections, so that I can verify the system is working correctly.

#### Acceptance Criteria

1. WHEN the camera module is active THEN the system SHALL display the live webcam feed at minimum 15 FPS
2. WHEN detections occur THEN the system SHALL draw bounding boxes for phones and people
3. WHEN a face is detected THEN the system SHALL draw facial landmarks and iris points
4. WHEN gaze and head pose are estimated THEN the system SHALL display directional indicators and text labels
5. WHEN violations occur THEN the system SHALL display warning text in red on the video feed
6. WHEN the system is processing THEN the system SHALL display FPS counter on the video feed
7. WHEN the user presses 'q' or ESC key THEN the system SHALL close the camera feed window

### Requirement 8: Test Mode UI Integration

**User Story:** As a developer, I want a dedicated test button on the login screen that launches the camera monitoring module, so that I can test and develop the feature without going through the full login flow.

#### Acceptance Criteria

1. WHEN the login screen is displayed THEN the system SHALL show a "Test Camera Module" button
2. WHEN the "Test Camera Module" button is clicked THEN the system SHALL bypass authentication
3. WHEN test mode is activated THEN the system SHALL initialize the webcam and start the monitoring pipeline
4. WHEN test mode is running THEN the system SHALL display the video feed with all overlays in a separate window
5. WHEN test mode is running THEN the system SHALL display a log panel showing detection events and violations
6. WHEN the user closes the test window THEN the system SHALL return to the login screen
7. WHEN test mode encounters an error THEN the system SHALL display an error message and return to login screen

### Requirement 9: Performance and Resource Optimization

**User Story:** As a student using the proctoring app, I want the monitoring system to run smoothly on my laptop without consuming excessive CPU or memory, so that my exam performance is not impacted.

#### Acceptance Criteria

1. WHEN the monitoring system is running THEN the system SHALL maintain CPU usage below 40% on a typical dual-core laptop
2. WHEN the monitoring system is running THEN the system SHALL maintain memory usage below 500MB
3. WHEN processing frames THEN the system SHALL achieve minimum 15 FPS on CPU-only systems
4. WHEN the webcam resolution is 640x480 THEN the system SHALL process frames within 65ms average latency
5. IF frame processing exceeds 100ms THEN the system SHALL skip that frame and continue with the next
6. WHEN models are loaded THEN the total model size SHALL NOT exceed 20MB on disk
7. WHEN the system starts THEN model initialization SHALL complete within 3 seconds

### Requirement 10: Logging and Event Tracking

**User Story:** As a proctor reviewing exam sessions, I want detailed logs of all detection events and violations, so that I can review suspicious behavior after the exam.

#### Acceptance Criteria

1. WHEN any violation is detected THEN the system SHALL log the event with timestamp, type, and confidence
2. WHEN the monitoring session starts THEN the system SHALL create a new log file with session ID and timestamp
3. WHEN the monitoring session ends THEN the system SHALL save the complete log file to disk
4. WHEN logging events THEN the system SHALL include frame number, timestamp, detection type, and metadata
5. WHEN a violation flag changes state THEN the system SHALL log both the start and end timestamps
6. WHEN the log file is created THEN the system SHALL use JSON format for easy parsing
7. IF logging fails THEN the system SHALL continue monitoring and display a warning message

### Requirement 11: Error Handling and Graceful Degradation

**User Story:** As a student, I want the monitoring system to handle errors gracefully without crashing my exam session, so that technical issues don't prevent me from completing my exam.

#### Acceptance Criteria

1. WHEN the webcam cannot be accessed THEN the system SHALL display an error message and retry 3 times
2. WHEN model loading fails THEN the system SHALL display a specific error message indicating which model failed
3. WHEN frame processing fails THEN the system SHALL skip that frame and continue with the next
4. WHEN MediaPipe detection fails THEN the system SHALL continue with YOLOv8n detections only
5. WHEN YOLOv8n detection fails THEN the system SHALL continue with MediaPipe detections only
6. IF both detection systems fail THEN the system SHALL log the error and notify the user
7. WHEN an unexpected exception occurs THEN the system SHALL log the stack trace and attempt to recover

### Requirement 12: Configuration and Thresholds

**User Story:** As a system administrator, I want to configure detection thresholds and sensitivity settings, so that I can tune the system for different exam scenarios and environments.

#### Acceptance Criteria

1. WHEN the system initializes THEN the system SHALL load configuration from a config file
2. WHEN configuration is loaded THEN the system SHALL apply detection confidence thresholds for YOLO and MediaPipe
3. WHEN configuration is loaded THEN the system SHALL apply timing thresholds for violation triggers
4. WHEN configuration is loaded THEN the system SHALL apply angle thresholds for head pose violations
5. IF the config file is missing THEN the system SHALL use default values and create a new config file
6. WHEN configuration values are invalid THEN the system SHALL use default values and log a warning
7. WHEN the system is running THEN configuration SHALL include: phone_confidence_threshold, person_confidence_threshold, gaze_away_duration_threshold, head_angle_threshold, blink_ear_threshold, no_blink_duration_threshold
