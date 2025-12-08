# Testing Guide for Camera Monitoring Module

This guide shows how to test the camera monitoring module using Python 3.11.

## Prerequisites

- Python 3.11 installed (verify with `py -3.11 --version`)
- All dependencies installed (already done!)
- Webcam available (for webcam tests)

---

## Test 1: Test with Webcam

**From project root:**
```powershell
cd backend/camera_monitoring
py -3.11 test_object_detector.py
```

**What it does:**
- Opens webcam and shows real-time detection
- Press 'q' to quit
- Press 's' to save current frame
- Shows phone and person bounding boxes

**Expected output:**
- Camera window opens
- Real-time detection overlays on video
- Status text showing phone/person count

---

## Test 2: Test with Image File

**From project root:**
```powershell
cd backend/camera_monitoring
py -3.11 test_object_detector.py path/to/image.jpg
```

**Example:**
```powershell
# If you have a test image
py -3.11 test_object_detector.py C:\Users\Haider\Desktop\test_photo.jpg

# Or relative path
py -3.11 test_object_detector.py ..\..\test_image.jpg
```

**What it does:**
- Loads image and runs detection
- Saves output with bounding boxes to `test_output.jpg`
- Prints detection results to console
- Optionally displays result window

**Expected output:**
```
Testing ObjectDetector with image: path/to/image.jpg
Image loaded: 1920x1080

Initializing ObjectDetector...
Loading YOLOv8n model (this may take a moment on first run)...
Model loaded successfully!
Model info: {'loaded': True, 'path': '...', ...}

Running detection...

=== Detection Results ===
Phone detected: True
  Confidence: 0.87
  Bounding box: [120, 150, 80, 120]

Person count: 1
  Bounding boxes: 1
    Person 1: [50, 30, 200, 350]

Output saved to: test_output.jpg
```

---

## Test 3: Test in Python REPL

**Start Python 3.11 REPL:**
```powershell
# From project root
py -3.11
```

**Then in Python REPL:**
```python
>>> import sys
>>> sys.path.insert(0, 'backend')
>>> from camera_monitoring.detectors.object_detector import ObjectDetector
>>> import cv2

>>> # Create detector
>>> detector = ObjectDetector()
>>> detector.load_model()
True

>>> # Load test image (replace with your image path)
>>> frame = cv2.imread('path/to/test_image.jpg')
>>> results = detector.detect(frame)

>>> # Check results
>>> print(f"Phone detected: {results['phone']['detected']}")
Phone detected: True
>>> print(f"Person count: {results['persons']['count']}")
Person count: 1

>>> # Get more details
>>> if results['phone']['detected']:
...     print(f"Phone confidence: {results['phone']['confidence']:.2f}")
...     print(f"Phone bbox: {results['phone']['bbox']}")
Phone confidence: 0.87
Phone bbox: [120, 150, 80, 120]

>>> # Exit REPL
>>> exit()
```

**Note:** Replace `'path/to/test_image.jpg'` with an actual image path on your system.

---

## Test 4: Verify Model Download

**The model will automatically download on first use if not found:**

```powershell
# Start Python 3.11 REPL
py -3.11
```

```python
>>> import sys
>>> sys.path.insert(0, 'backend')
>>> from camera_monitoring.detectors.object_detector import ObjectDetector

>>> detector = ObjectDetector()
>>> detector.load_model()  # Will download yolov8n.pt if not found
Downloading https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt...
100%|████████████████| 6.23M/6.23M [00:05<00:00, 1.15MB/s]
True

>>> # Check model info
>>> detector.get_model_info()
{'loaded': True, 'path': 'backend/camera_monitoring/models/yolov8n.pt', ...}
```

**Model location:**
- The model will be saved to: `backend/camera_monitoring/models/yolov8n.pt`
- Size: ~6 MB
- Downloaded automatically on first use

---

## Test 5: Quick Import Test

**Quick test to verify everything is set up correctly:**

```powershell
# From project root
py -3.11 -c "import sys; sys.path.insert(0, 'backend'); from camera_monitoring.detectors.object_detector import ObjectDetector; from camera_monitoring import config; print('✅ All imports successful!'); print(f'Phone threshold: {config.PHONE_CONFIDENCE_THRESHOLD}')"
```

**Expected output:**
```
✅ All imports successful!
Phone threshold: 0.5
```

---

## Test 6: Full Module Test

**Test all components together:**

```powershell
# From project root
py -3.11 -c "import sys; sys.path.insert(0, 'backend'); from camera_monitoring.detectors.object_detector import ObjectDetector; from camera_monitoring import config; import cv2; import numpy as np; print('✅ All modules imported'); detector = ObjectDetector(); print('✅ Detector created'); result = detector.load_model(); print(f'✅ Model loaded: {result}'); test_frame = np.zeros((640, 480, 3), dtype=np.uint8); results = detector.detect(test_frame); print(f'✅ Detection test: Phone={results[\"phone\"][\"detected\"]}, Persons={results[\"persons\"][\"count\"]}')"
```

**Expected output:**
```
✅ All modules imported
✅ Detector created
✅ Model loaded: True
✅ Detection test: Phone=False, Persons=0
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'camera_monitoring'"

**Solution:**
```powershell
# Make sure you're adding 'backend' to the path
py -3.11
>>> import sys
>>> sys.path.insert(0, 'backend')  # From project root
>>> from camera_monitoring import config
```

### Issue: "Model file not found"

**Solution:**
- The model will auto-download on first use
- Or manually download: The `load_model()` method will handle it automatically

### Issue: "Camera access denied"

**Solution:**
- Check camera permissions in Windows Settings
- Make sure no other application is using the camera
- Try running PowerShell as Administrator

### Issue: "Import cv2 failed"

**Solution:**
```powershell
# Reinstall OpenCV
py -3.11 -m pip install --force-reinstall opencv-python
```

---

## Quick Reference

| Test | Command |
|------|---------|
| Webcam test | `cd backend/camera_monitoring && py -3.11 test_object_detector.py` |
| Image test | `cd backend/camera_monitoring && py -3.11 test_object_detector.py image.jpg` |
| REPL test | `py -3.11` then `import sys; sys.path.insert(0, 'backend')` |
| Quick import | `py -3.11 -c "import sys; sys.path.insert(0, 'backend'); from camera_monitoring import config"` |
| Model download | `py -3.11` then `detector.load_model()` |

---

## Next Steps

After testing:
1. ✅ Verify object detector works
2. ✅ Proceed to Phase 1.4 - Face Analyzer
3. ✅ Continue with remaining phases

---

**Happy Testing!** 🧪

