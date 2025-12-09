const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PYTHON_REQUIREMENTS = path.join(PROJECT_ROOT, 'python_requirements.txt');
const MODEL_PATH = path.join(PROJECT_ROOT, 'backend', 'camera_monitoring', 'models', 'yolov8n.pt');
const MODEL_URL = 'https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt';
const CAMERA_MONITORING_DIR = path.join(PROJECT_ROOT, 'backend', 'camera_monitoring');
const MODELS_DIR = path.join(CAMERA_MONITORING_DIR, 'models');
const DETECTORS_DIR = path.join(CAMERA_MONITORING_DIR, 'detectors');
const UTILS_DIR = path.join(CAMERA_MONITORING_DIR, 'utils');

async function main() {
  console.log('🚀 Starting camera monitoring setup...\n');

  try {
    // Step 1: Check Python installation and version
    console.log('📋 Step 1/6: Checking Python installation...');
    const python = await findPython();
    console.log(`✅ Using Python: ${python.cmd} ${python.args.join(' ')}\n`);

    // Step 2: Create necessary directories
    console.log('📋 Step 2/6: Creating necessary directories...');
    await createDirectories();
    console.log('✅ Directories created\n');

    // Step 3: Install Python dependencies
    console.log('📋 Step 3/6: Installing Python dependencies...');
    await installPythonDependencies(python);
    console.log('✅ Dependencies installed\n');

    // Step 4: Verify Python modules
    console.log('📋 Step 4/6: Verifying Python modules...');
    await verifyPythonModules(python);
    console.log('✅ Modules verified\n');

    // Step 5: Download YOLOv8n model if missing
    console.log('📋 Step 5/6: Checking YOLOv8n model...');
    await ensureYoloModel(python);
    console.log('✅ Model ready\n');

    // Step 6: Test camera access
    console.log('📋 Step 6/6: Testing camera access...');
    await testCameraAccess(python);
    console.log('✅ Camera access verified\n');

    console.log('🎉 Camera monitoring setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   - Run the camera processor: py -3.11 -m camera_monitoring.camera_processor');
    console.log('   - Or start the Electron app to use the camera monitoring module');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Camera monitoring setup failed!\n');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    
    if (error.message.includes('Python')) {
      console.error('   - Install Python 3.9, 3.10, or 3.11 from https://www.python.org/downloads/');
      console.error('   - Ensure Python is added to your system PATH');
      console.error('   - On Windows, try: py -3.11 --version');
    } else if (error.message.includes('pip install')) {
      console.error('   - Check your internet connection');
      console.error('   - Try running: py -3.11 -m pip install --upgrade pip');
      console.error('   - For MediaPipe issues, try: py -3.11 -m pip install mediapipe --no-build-isolation');
    } else if (error.message.includes('camera') || error.message.includes('Camera')) {
      console.error('   - Ensure a webcam is connected and not in use by another application');
      console.error('   - Check camera permissions in system settings');
      console.error('   - Try disconnecting and reconnecting the camera');
    } else if (error.message.includes('model') || error.message.includes('Model')) {
      console.error('   - Check your internet connection');
      console.error('   - The model will be downloaded automatically on first use');
    } else {
      console.error('   - Check the error message above for specific issues');
      console.error('   - Ensure all prerequisites are installed');
    }
    
    console.error('\n📚 For more help, see the documentation in docs/camera-monitoring/');
    process.exit(1);
  }
}

async function findPython() {
  console.log('   Searching for Python 3.9-3.11...');
  
  const candidates = [
    { cmd: 'py', args: ['-3.11'] },
    { cmd: 'py', args: ['-3.10'] },
    { cmd: 'py', args: ['-3.9'] },
    { cmd: 'python3.11', args: [] },
    { cmd: 'python3.10', args: [] },
    { cmd: 'python3.9', args: [] },
    { cmd: 'python3', args: [] },
    { cmd: 'python', args: [] }
  ];

  for (const candidate of candidates) {
    try {
      const result = await runCommand(candidate.cmd, [...candidate.args, '--version']);
      if (result.code !== 0) {
        continue;
      }

      const versionText = (result.stdout || result.stderr || '').trim();
      const match = versionText.match(/Python\s+(\d+)\.(\d+)/i);
      if (!match) {
        continue;
      }

      const major = Number(match[1]);
      const minor = Number(match[2]);

      if (major === 3 && minor >= 9 && minor <= 11) {
        console.log(`   Found Python ${major}.${minor}`);
        return candidate;
      }
    } catch (err) {
      // Command not found, try next candidate
      continue;
    }
  }

  throw new Error('Python 3.9 - 3.11 not found. Please install Python 3.9, 3.10, or 3.11 and ensure it is on your system PATH.');
}

async function createDirectories() {
  const directories = [
    CAMERA_MONITORING_DIR,
    MODELS_DIR,
    DETECTORS_DIR,
    UTILS_DIR
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   Created: ${path.relative(PROJECT_ROOT, dir)}`);
    }
  }
}

async function installPythonDependencies(python) {
  if (!fs.existsSync(PYTHON_REQUIREMENTS)) {
    throw new Error(`Missing python_requirements.txt at ${PYTHON_REQUIREMENTS}`);
  }

  console.log('   Installing packages from python_requirements.txt...');
  const result = await runCommand(
    python.cmd,
    [...python.args, '-m', 'pip', 'install', '-r', PYTHON_REQUIREMENTS],
    { cwd: PROJECT_ROOT, pipeOutput: true }
  );

  if (result.code !== 0) {
    throw new Error(`pip install failed. Error: ${result.stderr || result.stdout || 'Unknown error'}`);
  }
}

async function verifyPythonModules(python) {
  console.log('   Verifying core Python modules...');
  const code = `
import importlib
modules = {
    'cv2': 'OpenCV',
    'mediapipe': 'MediaPipe',
    'ultralytics': 'Ultralytics (YOLOv8)',
    'numpy': 'NumPy'
}
failed = []
for module_name, display_name in modules.items():
    try:
        importlib.import_module(module_name)
        print(f"[OK] {display_name}")
    except Exception as exc:
        failed.append(f"{display_name} ({module_name}): {exc}")
        print(f"[FAIL] {display_name}: {exc}")

if failed:
    raise SystemExit("Missing/failed imports: " + "; ".join(failed))
`;

  const result = await runCommand(
    python.cmd,
    [...python.args, '-c', code],
    { cwd: PROJECT_ROOT, pipeOutput: true }
  );

  if (result.code !== 0) {
    throw new Error(`Module verification failed: ${result.stderr || result.stdout || 'Unknown error'}`);
  }
  
  // Parse output and show results with emojis in Node.js console
  const output = result.stdout || '';
  const lines = output.split('\\n').filter(line => line.trim());
  for (const line of lines) {
    if (line.includes('[OK]')) {
      const moduleName = line.replace('[OK]', '').trim();
      console.log(`   ✅ ${moduleName}`);
    } else if (line.includes('[FAIL]')) {
      const moduleName = line.replace('[FAIL]', '').trim();
      console.log(`   ❌ ${moduleName}`);
    }
  }
}

async function ensureYoloModel(python) {
  if (fs.existsSync(MODEL_PATH)) {
    const stats = fs.statSync(MODEL_PATH);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   YOLOv8n model already present (${sizeMB} MB)`);
    return;
  }

  console.log('   Downloading YOLOv8n model (this may take a few minutes)...');
  const downloadCode = `
import urllib.request
from pathlib import Path
import sys

url = "${MODEL_URL}"
dest = Path(r"${MODEL_PATH.replace(/\\/g, '\\\\')}")
dest.parent.mkdir(parents=True, exist_ok=True)

def progress_hook(count, block_size, total_size):
    percent = int(count * block_size * 100 / total_size)
    sys.stdout.write(f"\\r   Progress: {percent}%")
    sys.stdout.flush()

try:
    print(f"Downloading from {url}")
    urllib.request.urlretrieve(url, dest, progress_hook)
    print(f"\\n   Download complete: {dest}")
except Exception as e:
    print(f"\\n   Download failed: {e}")
    sys.exit(1)
`;

  const result = await runCommand(
    python.cmd,
    [...python.args, '-c', downloadCode],
    { cwd: PROJECT_ROOT, pipeOutput: true }
  );

  if (result.code !== 0) {
    throw new Error(`Model download failed: ${result.stderr || result.stdout || 'Unknown error'}`);
  }

  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error('Model download reported success but file not found. Please try running the setup again.');
  }
  
  const stats = fs.statSync(MODEL_PATH);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   Model downloaded successfully (${sizeMB} MB)`);
}

async function testCameraAccess(python) {
  console.log('   Testing camera access...');
  const testCode = `
import cv2
import sys

# Try to open camera
camera = None
try:
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("[FAIL] Camera not accessible (index 0)")
        sys.exit(1)
    
    # Try to read a frame
    ret, frame = camera.read()
    if not ret or frame is None:
        print("[FAIL] Cannot read frames from camera")
        sys.exit(1)
    
    print("[OK] Camera access verified")
    camera.release()
except Exception as e:
    if camera:
        camera.release()
    print(f"[FAIL] Camera test failed: {e}")
    sys.exit(1)
`;

  const result = await runCommand(
    python.cmd,
    [...python.args, '-c', testCode],
    { cwd: PROJECT_ROOT }
  );

  if (result.code !== 0) {
    const errorMsg = result.stderr || result.stdout || 'Unknown error';
    throw new Error(`Camera access test failed: ${errorMsg}`);
  }
  
  console.log('   ✅ Camera is accessible');
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      shell: false
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (options.pipeOutput) {
          process.stdout.write(text);
        }
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        if (options.pipeOutput) {
          process.stderr.write(text);
        }
      });
    }

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (error) => {
      resolve({ code: 1, stdout, stderr: error.message });
    });
  });
}

main();

