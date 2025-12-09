const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PYTHON_REQUIREMENTS = path.join(PROJECT_ROOT, 'python_requirements.txt');
const MODEL_PATH = path.join(PROJECT_ROOT, 'backend', 'camera_monitoring', 'models', 'yolov8n.pt');
const MODEL_URL = 'https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt';

async function main() {
  try {
    const python = await findPython();
    console.log(`✅ Using Python: ${python.cmd} ${python.args.join(' ')}`);

    await installPythonDependencies(python);
    await verifyPythonModules(python);
    await ensureYoloModel(python);

    console.log('🎉 Camera monitoring setup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Camera monitoring setup failed:', error.message);
    process.exit(1);
  }
}

async function findPython() {
  const candidates = [
    { cmd: 'py', args: ['-3.11'] },
    { cmd: 'python3', args: [] },
    { cmd: 'python', args: [] }
  ];

  for (const candidate of candidates) {
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
      return candidate;
    }
  }

  throw new Error('Python 3.9 - 3.11 not found. Install Python 3.11 and ensure it is on PATH.');
}

async function installPythonDependencies(python) {
  console.log('📦 Installing Python dependencies...');

  if (!fs.existsSync(PYTHON_REQUIREMENTS)) {
    throw new Error(`Missing python_requirements.txt at ${PYTHON_REQUIREMENTS}`);
  }

  const result = await runCommand(
    python.cmd,
    [...python.args, '-m', 'pip', 'install', '-r', PYTHON_REQUIREMENTS],
    { cwd: PROJECT_ROOT, pipeOutput: true }
  );

  if (result.code !== 0) {
    throw new Error(`pip install failed: ${result.stderr || result.stdout}`);
  }
}

async function verifyPythonModules(python) {
  console.log('🔍 Verifying core Python modules (cv2, mediapipe, ultralytics)...');
  const code = `
import importlib
modules = ['cv2', 'mediapipe', 'ultralytics', 'numpy']
failed = []
for m in modules:
    try:
        importlib.import_module(m)
    except Exception as exc:
        failed.append(f"{m}: {exc}")

if failed:
    raise SystemExit("Missing/failed imports: " + "; ".join(failed))
print("All core modules loaded successfully.")
`;

  const result = await runCommand(
    python.cmd,
    [...python.args, '-c', code],
    { cwd: PROJECT_ROOT }
  );

  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || 'Module verification failed');
  }
}

async function ensureYoloModel(python) {
  if (fs.existsSync(MODEL_PATH)) {
    console.log('✅ YOLOv8n model already present.');
    return;
  }

  console.log('⬇️  Downloading YOLOv8n model...');
  const downloadCode = `
import urllib.request
from pathlib import Path
url = "${MODEL_URL}"
dest = Path(r"${MODEL_PATH.replace(/\\/g, '\\\\')}")
dest.parent.mkdir(parents=True, exist_ok=True)
print(f"Downloading {url} -> {dest}")
urllib.request.urlretrieve(url, dest)
print("Download complete")
`;

  const result = await runCommand(
    python.cmd,
    [...python.args, '-c', downloadCode],
    { cwd: PROJECT_ROOT, pipeOutput: true }
  );

  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || 'Model download failed');
  }

  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error('Model download reported success but file not found');
  }
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

