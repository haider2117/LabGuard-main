# LAB-Guard - Exam Monitoring System

## 📁 Project Structure

```
LAB-Guard/
├── 📂 .github/
│   └── information/         # Documentation
│       ├── Debug_Summary.md # Debugging guide
│       └── SETUP.md         # Setup instructions
│
├── 📂 frontend/              # React + TypeScript UI
│   ├── src/                 # React components and services
│   ├── public/              # Static assets and AI models
│   ├── .env                 # React dev server config
│   └── tsconfig.json        # TypeScript configuration
│
├── 📂 backend/               # Electron + Node.js Backend
│   ├── app/                 # Electron main process
│   │   ├── main.js         # Main process entry
│   │   └── preload.js      # IPC bridge
│   ├── services/            # Backend services
│   ├── scripts/             # Backend utility scripts
│   └── data/                # SQLite database
│
├── � Pscripts/               # Development helper scripts
│   ├── start-react.js      # React dev server starter
│   ├── start-electron.js   # Electron launcher
│   ├── rebuild-sqlite.js   # Rebuild native modules
│   └── reset-database.js   # Database reset utility
│
├── 📂 config/                # Configuration files
├── 📄 package.json           # Dependencies and scripts
├── 📄 README.md              # This file
└── 📄 FYP.pdf                # Project report
```

## 🚀 Quick Start

### Prerequisites
- Node.js v14 or higher
- Windows 10/11
- Webcam (for face authentication)
- Python 3.9, 3.10, or 3.11 (for camera monitoring module)

### Installation
```bash
npm install
```

### Development Mode
```bash
npm run dev
```
Runs React dev server on port 3001 and launches Electron.

### Production Build
```bash
npm run build
npm start
```

### Download Face Recognition Models
```bash
npm run download-models
```

### Setup Camera Monitoring Module
```bash
npm run setup-camera
```
Sets up Python environment, installs dependencies, downloads YOLOv8n model, and verifies camera access.

### Test Camera Monitoring
```bash
npm run test-camera
```
Runs the camera processor standalone to test detection capabilities.

## 📚 Documentation

### General Documentation
- **[Setup Guide](.github/information/SETUP.md)** - Complete installation and setup instructions
- **[Debug Summary](.github/information/Debug_Summary.md)** - Common issues and fixes
- **[Project Report](FYP.pdf)** - Complete project documentation

### Camera Monitoring Documentation
- **[User Guide](docs/camera-monitoring/USER_GUIDE.md)** - How to use the camera monitoring module
- **[Configuration Guide](docs/camera-monitoring/CONFIGURATION.md)** - Configuration options and tuning
- **[Testing Guide](docs/camera-monitoring/TESTING_GUIDE.md)** - Testing instructions
- **[Implementation Tasks](docs/camera-monitoring/TASKS.md)** - Development progress tracking
- **[Requirements](docs/camera-monitoring/REQUIREMENTS.md)** - Functional requirements
- **[Design Document](docs/camera-monitoring/DESIGN.md)** - Technical architecture

## 🎯 Key Features

### Multi-Factor Authentication
- Username/password authentication
- Biometric face recognition (2FA)
- JWT token-based sessions
- Device fingerprinting

### Real-Time Monitoring
- Windows API integration
- Application switching detection
- Screenshot evidence capture
- Violation tracking and alerts
- **Camera-based monitoring** (NEW)
  - Mobile phone detection (YOLOv8n)
  - Person counting (multiple person detection)
  - Face detection and head pose estimation (MediaPipe)
  - Gaze direction tracking
  - Blink detection
  - Real-time violation logging

### Role-Based Access
- **Admin** - User management, system configuration
- **Teacher** - Exam creation, monitoring, reports
- **Student** - Exam participation with monitoring

### Security Features
- bcrypt password hashing (12 rounds)
- Face embeddings (128-dimension vectors)
- Complete audit logging
- Offline-capable operation

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript
- Face-API.js (TensorFlow.js)
- CSS3 for styling

### Backend
- Electron (Desktop framework)
- Node.js runtime
- SQLite database
- Windows API integration
- **Camera Monitoring** (Python subprocess)
  - YOLOv8n for object detection
  - MediaPipe Face Mesh for facial analysis
  - OpenCV for camera capture
  - JSON-based IPC communication

### Security
- JWT authentication
- bcrypt encryption
- Biometric verification
- Audit trail logging

## 📦 Available Scripts

```bash
npm start              # Start production app
npm run dev            # Development mode (starts both React & Electron)
npm run build          # Build React app
npm run download-models # Download AI models
npm run setup-camera   # Setup camera monitoring module (Python dependencies, models)
npm run test-camera    # Test camera monitoring processor standalone
npm run rebuild        # Rebuild better-sqlite3 for Electron
npm run reset-db       # Reset database to clean state
npm test               # Run tests
```

## 🔐 Security Protocols

- **Password Security**: bcrypt with 12 salt rounds
- **Face Recognition**: 128-dimension embeddings, no images stored
- **Session Management**: JWT tokens with 8-hour expiration
- **Monitoring**: System-level Windows API, can't be bypassed
- **Audit Logging**: Complete traceability of all actions

## 📊 Database Schema

- **users** - User accounts with roles
- **exams** - Exam configurations
- **face_embeddings** - Biometric data
- **events** - Monitoring events
- **app_violations** - Application violations
- **audit_logs** - Security audit trail

## 📹 Camera Monitoring Module

The camera monitoring module provides real-time detection of exam violations using computer vision:

### Features
- **Phone Detection**: Detects mobile phones in camera frame (YOLOv8n)
- **Person Counting**: Monitors for multiple persons in frame
- **Face Analysis**: Detects face, estimates head pose (yaw, pitch, roll)
- **Gaze Tracking**: Monitors gaze direction (left/center/right)
- **Blink Detection**: Tracks eye blinks using EAR (Eye Aspect Ratio)

### Usage

**Test Camera Module:**
1. Start the app: `npm run dev`
2. On login screen, click **"Test Camera Module"** button
3. Click **"Start Monitoring"** to begin detection
4. View real-time status and violation logs

**Setup (First Time):**
```bash
npm run setup-camera
```

This will:
- Check Python 3.9-3.11 installation
- Install Python dependencies (OpenCV, MediaPipe, Ultralytics)
- Download YOLOv8n model (~6 MB)
- Verify camera access

### Architecture

```
Frontend (React) → Electron IPC → Node.js Service → Python Subprocess
                                                      ↓
                                              Camera + ML Models
```

- **Frontend**: `CameraTestModule.tsx` - UI for testing and monitoring
- **Node.js**: `cameraMonitoringService.js` - Process management and IPC
- **Python**: `camera_processor.py` - ML/CV processing pipeline
- **Models**: YOLOv8n (object detection), MediaPipe (face analysis)

### Configuration

Edit `backend/camera_monitoring/config.py` to adjust:
- Detection thresholds (phone confidence, person count)
- Head pose ranges (facing screen angles)
- Gaze thresholds (left/center/right)
- Blink detection (EAR threshold)
- Camera settings (resolution, FPS)
- Performance (frame skip, processing time limits)

### Documentation

- **[Camera Monitoring Tasks](docs/camera-monitoring/TASKS.md)** - Implementation progress
- **[Camera Monitoring Requirements](docs/camera-monitoring/REQUIREMENTS.md)** - Functional requirements
- **[Camera Monitoring Design](docs/camera-monitoring/DESIGN.md)** - Technical architecture
- **[Testing Guide](docs/camera-monitoring/TESTING_GUIDE.md)** - Testing instructions

## 🎓 Use Cases

- University computer lab exams
- Online certification tests
- Remote learning assessments
- Corporate training evaluations

## 📝 License

Proprietary - LAB-Guard Development Team

## 🤝 Support

For technical documentation, see:
- [Setup Guide](.github/information/SETUP.md)
- [Debug Summary](.github/information/Debug_Summary.md)
- [Project Report](FYP.pdf)

---

**Version:** 1.0.0  
**Platform:** Windows 10/11  
**Framework:** Electron + React
