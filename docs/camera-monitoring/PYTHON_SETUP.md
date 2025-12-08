# Python Setup Guide for Camera Monitoring Module

## Issue: Python Version Compatibility

### Problem
You're encountering installation errors because:
1. **Python 3.14** is installed (too new)
2. **MediaPipe** only supports Python **3.8-3.11**
3. The standalone `pip` command is broken (pointing to non-existent Python 3.13)

### Solutions

## ✅ Solution 1: Use Python 3.11 (Recommended)

**Best option for full compatibility:**

1. **Install Python 3.11**:
   - Download from: https://www.python.org/downloads/release/python-3110/
   - Choose: Windows installer (64-bit)
   - During installation, check "Add Python to PATH"

2. **Verify installation**:
   ```powershell
   py -3.11 --version
   # Should show: Python 3.11.x
   ```

3. **Install dependencies**:
   ```powershell
   py -3.11 -m pip install -r python_requirements.txt
   ```

4. **Use Python 3.11 for the project**:
   ```powershell
   py -3.11 -m pip install opencv-python mediapipe ultralytics numpy Pillow
   ```

---

## ✅ Solution 2: Fix pip and Try Alternative Installation

**If you want to keep Python 3.14:**

1. **Always use `python -m pip` instead of `pip`**:
   ```powershell
   python -m pip install opencv-python numpy Pillow ultralytics
   ```

2. **For MediaPipe, try building from source** (may not work):
   ```powershell
   python -m pip install mediapipe --no-build-isolation
   ```

3. **Or wait for MediaPipe to support Python 3.14** (not available yet)

**Note**: MediaPipe is critical for face detection. Without it, the camera module won't work.

---

## ✅ Solution 3: Use Virtual Environment with Python 3.11

**Isolate the project with correct Python version:**

1. **Install Python 3.11** (if not already installed)

2. **Create virtual environment**:
   ```powershell
   py -3.11 -m venv venv_camera
   ```

3. **Activate virtual environment**:
   ```powershell
   .\venv_camera\Scripts\Activate.ps1
   ```

4. **Install dependencies**:
   ```powershell
   python -m pip install -r python_requirements.txt
   ```

5. **Verify installation**:
   ```powershell
   python -c "import cv2, mediapipe, ultralytics; print('All packages installed!')"
   ```

---

## 🔧 Fixing Broken pip Command

The standalone `pip` command is broken. **Always use `python -m pip` instead:**

```powershell
# ❌ Don't use (broken):
pip install package

# ✅ Use this instead:
python -m pip install package
```

**To fix the broken pip launcher** (optional):
```powershell
python -m pip install --upgrade pip
python -m pip install --force-reinstall pip
```

---

## 📋 Quick Installation Checklist

- [ ] Python 3.9-3.11 installed (check with `python --version`)
- [ ] Using `python -m pip` instead of `pip`
- [ ] All packages installed successfully
- [ ] Test import: `python -c "import cv2, mediapipe, ultralytics"`

---

## 🧪 Testing Installation

After installation, test each package:

```powershell
# Test OpenCV
python -c "import cv2; print(f'OpenCV: {cv2.__version__}')"

# Test MediaPipe
python -c "import mediapipe; print(f'MediaPipe: {mediapipe.__version__}')"

# Test Ultralytics
python -c "from ultralytics import YOLO; print('YOLO imported successfully')"

# Test NumPy
python -c "import numpy; print(f'NumPy: {numpy.__version__}')"
```

---

## ⚠️ Known Issues

1. **Python 3.12+**: MediaPipe may not have pre-built wheels
2. **Python 3.14**: Not supported by MediaPipe yet
3. **Broken pip**: Use `python -m pip` instead

---

## 💡 Recommended Setup

**For LabGuard Camera Module:**
- **Python Version**: 3.11 (most compatible)
- **Installation Method**: `python -m pip install -r python_requirements.txt`
- **Virtual Environment**: Recommended for isolation

---

## 📞 Need Help?

If you continue to have issues:
1. Check Python version: `python --version`
2. Try installing packages one by one to identify the problem
3. Consider using Python 3.11 for best compatibility

