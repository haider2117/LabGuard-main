import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CameraTestModule.css';

// TypeScript interfaces for camera status data
interface CameraStatus {
  type: string;
  timestamp: number;
  frame_number?: number;
  fps?: number;
  phone_detected?: boolean;
  phone_confidence?: number;
  phone_bbox?: number[];
  person_count?: number;
  face_detected?: boolean;
  head_pose?: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  gaze_direction?: string;
  is_facing_screen?: boolean;
  blink_detected?: boolean;
  ear_value?: number;
  violations?: string[];
  error?: boolean;
  error_type?: string;
  message?: string;
}

interface ViolationEvent {
  id: string;
  timestamp: Date;
  type: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
}

interface ServiceStatus {
  isMonitoring: boolean;
  pid: number | null;
  startTime: number | null;
  uptime: number;
  lastStatus: CameraStatus | null;
  stats: {
    statusUpdates: number;
    errors: number;
    restarts: number;
  };
}

interface CameraTestModuleProps {
  onClose: () => void;
}

const CameraTestModule: React.FC<CameraTestModuleProps> = ({ onClose }) => {
  // State management
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<CameraStatus | null>(null);
  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [uptime, setUptime] = useState<number>(0);
  const [statusCount, setStatusCount] = useState<number>(0);

  // Refs for cleanup
  const unsubscribeStatusRef = useRef<(() => void) | null>(null);
  const unsubscribeErrorRef = useRef<(() => void) | null>(null);
  const unsubscribeExitRef = useRef<(() => void) | null>(null);
  const uptimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Check if running in Electron
  const isElectron = useCallback(() => {
    return typeof window !== 'undefined' &&
      (window as any).electronAPI &&
      (window as any).electronAPI.camera &&
      typeof (window as any).electronAPI.camera.startTest === 'function';
  }, []);

  // Add violation to log
  const addViolation = useCallback((type: string, message: string, severity: ViolationEvent['severity'] = 'warning') => {
    const newViolation: ViolationEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
      severity
    };
    setViolations(prev => [newViolation, ...prev].slice(0, 100)); // Keep last 100
  }, []);

  // Handle status updates from Python processor
  const handleStatusUpdate = useCallback((status: CameraStatus) => {
    setCurrentStatus(status);
    setStatusCount(prev => prev + 1);

    if (status.fps) {
      setFps(status.fps);
    }

    // Check for violations and add to log
    if (status.violations && status.violations.length > 0) {
      status.violations.forEach(violation => {
        addViolation('violation', violation, 'warning');
      });
    }

    // Check specific violation conditions
    if (status.phone_detected) {
      addViolation('phone', `Phone detected (confidence: ${((status.phone_confidence || 0) * 100).toFixed(1)}%)`, 'error');
    }

    if (status.person_count && status.person_count > 1) {
      addViolation('person', `Multiple persons detected: ${status.person_count}`, 'error');
    }

    if (status.person_count === 0 && status.type === 'status') {
      addViolation('person', 'No person detected in frame', 'warning');
    }

    if (status.face_detected === false && status.type === 'status') {
      addViolation('face', 'Face not detected', 'warning');
    }

    if (status.is_facing_screen === false && status.face_detected) {
      addViolation('gaze', 'Not facing screen', 'warning');
    }

    // Handle error status
    if (status.error) {
      setError(status.message || 'Unknown error occurred');
      addViolation('error', status.message || 'Unknown error', 'error');
    }

    // Handle ready and shutdown messages
    if (status.type === 'ready') {
      addViolation('system', 'Camera processor ready', 'info');
    } else if (status.type === 'shutdown') {
      addViolation('system', status.message || 'Camera processor shutdown', 'info');
    }
  }, [addViolation]);

  // Handle errors from Python processor
  const handleError = useCallback((errorData: any) => {
    const errorMessage = errorData?.message || errorData?.error || 'Unknown error';
    setError(errorMessage);
    addViolation('error', errorMessage, 'error');
  }, [addViolation]);

  // Handle process exit
  const handleProcessExit = useCallback((exitData: any) => {
    setIsMonitoring(false);
    setIsLoading(false);
    
    if (exitData.code !== 0 && exitData.signal !== 'SIGTERM') {
      setError(`Camera process exited unexpectedly (code: ${exitData.code})`);
      addViolation('system', `Process exited with code ${exitData.code}`, 'error');
    } else {
      addViolation('system', 'Monitoring stopped', 'info');
    }

    // Clear uptime interval
    if (uptimeIntervalRef.current) {
      clearInterval(uptimeIntervalRef.current);
      uptimeIntervalRef.current = null;
    }
  }, [addViolation]);

  // Setup event listeners
  useEffect(() => {
    if (!isElectron()) return;

    const api = (window as any).electronAPI.camera;

    // Subscribe to status updates
    unsubscribeStatusRef.current = api.onStatusUpdate(handleStatusUpdate);
    unsubscribeErrorRef.current = api.onError(handleError);
    unsubscribeExitRef.current = api.onProcessExit(handleProcessExit);

    // Check initial status
    const checkStatus = async () => {
      try {
        const result = await api.getStatus();
        if (result.success && result.status) {
          setIsMonitoring(result.status.isMonitoring);
          if (result.status.isMonitoring && result.status.startTime) {
            startTimeRef.current = result.status.startTime;
            setUptime(Date.now() - result.status.startTime);
          }
        }
      } catch (err) {
        console.error('Failed to get camera status:', err);
      }
    };
    checkStatus();

    // Cleanup on unmount
    return () => {
      if (unsubscribeStatusRef.current) {
        unsubscribeStatusRef.current();
      }
      if (unsubscribeErrorRef.current) {
        unsubscribeErrorRef.current();
      }
      if (unsubscribeExitRef.current) {
        unsubscribeExitRef.current();
      }
      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
      }
    };
  }, [isElectron, handleStatusUpdate, handleError, handleProcessExit]);

  // Update uptime periodically when monitoring
  useEffect(() => {
    if (isMonitoring && startTimeRef.current) {
      uptimeIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setUptime(Date.now() - startTimeRef.current);
        }
      }, 1000);
    } else {
      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
        uptimeIntervalRef.current = null;
      }
    }

    return () => {
      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
      }
    };
  }, [isMonitoring]);

  // Start monitoring
  const handleStartMonitoring = async () => {
    if (!isElectron()) {
      setError('Camera monitoring requires the Electron app. Please run with "npm run dev".');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const api = (window as any).electronAPI.camera;
      const result = await api.startTest({ debug: true });

      if (result.success) {
        setIsMonitoring(true);
        startTimeRef.current = Date.now();
        setUptime(0);
        setStatusCount(0);
        addViolation('system', `Monitoring started (PID: ${result.pid})`, 'info');
      } else {
        setError(result.error || 'Failed to start monitoring');
        addViolation('error', result.error || 'Failed to start monitoring', 'error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start monitoring');
      addViolation('error', err.message || 'Failed to start monitoring', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop monitoring
  const handleStopMonitoring = async () => {
    if (!isElectron()) return;

    setIsLoading(true);

    try {
      const api = (window as any).electronAPI.camera;
      const result = await api.stopTest();

      if (result.success) {
        setIsMonitoring(false);
        startTimeRef.current = null;
        addViolation('system', 'Monitoring stopped by user', 'info');
      } else {
        setError(result.error || 'Failed to stop monitoring');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stop monitoring');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear violations log
  const handleClearLog = () => {
    setViolations([]);
  };

  // Clear error
  const handleClearError = () => {
    setError(null);
  };

  // Format uptime
  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Get status indicator class
  const getStatusClass = (value: boolean | undefined, invert: boolean = false): string => {
    if (value === undefined) return 'status-unknown';
    const isGood = invert ? !value : value;
    return isGood ? 'status-good' : 'status-bad';
  };

  // Get gaze direction indicator
  const getGazeIndicator = (direction: string | undefined): string => {
    switch (direction) {
      case 'center': return '⬆️';
      case 'left': return '⬅️';
      case 'right': return '➡️';
      case 'up': return '⬆️';
      case 'down': return '⬇️';
      default: return '❓';
    }
  };

  return (
    <div className="camera-test-container">
      <div className="camera-test-card">
        {/* Header */}
        <div className="camera-test-header">
          <div className="header-title">
            <div className="camera-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17" cy="8" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h2>Camera Monitoring Test</h2>
              <p>Test the camera monitoring module</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose} title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button className="error-dismiss" onClick={handleClearError}>×</button>
          </div>
        )}

        {/* Main Content */}
        <div className="camera-test-content">
          {/* Left Panel - Status */}
          <div className="status-panel">
            <h3>📊 Detection Status</h3>
            
            {/* Monitoring Status */}
            <div className="status-section">
              <div className="status-row">
                <span className="status-label">Monitoring</span>
                <span className={`status-badge ${isMonitoring ? 'active' : 'inactive'}`}>
                  {isMonitoring ? '● Active' : '○ Inactive'}
                </span>
              </div>
              {isMonitoring && (
                <>
                  <div className="status-row">
                    <span className="status-label">Uptime</span>
                    <span className="status-value">{formatUptime(uptime)}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">FPS</span>
                    <span className="status-value">{fps.toFixed(1)}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Frames Processed</span>
                    <span className="status-value">{statusCount}</span>
                  </div>
                </>
              )}
            </div>

            {/* Detection Status */}
            {currentStatus && (
              <>
                <div className="status-section">
                  <h4>🔍 Object Detection</h4>
                  <div className="status-row">
                    <span className="status-label">Phone Detected</span>
                    <span className={`status-indicator ${getStatusClass(currentStatus.phone_detected, true)}`}>
                      {currentStatus.phone_detected ? '❌ Yes' : '✅ No'}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Person Count</span>
                    <span className={`status-indicator ${currentStatus.person_count === 1 ? 'status-good' : 'status-bad'}`}>
                      {currentStatus.person_count ?? 0}
                    </span>
                  </div>
                </div>

                <div className="status-section">
                  <h4>👤 Face Analysis</h4>
                  <div className="status-row">
                    <span className="status-label">Face Detected</span>
                    <span className={`status-indicator ${getStatusClass(currentStatus.face_detected)}`}>
                      {currentStatus.face_detected ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Facing Screen</span>
                    <span className={`status-indicator ${getStatusClass(currentStatus.is_facing_screen)}`}>
                      {currentStatus.is_facing_screen ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                </div>

                {currentStatus.head_pose && (
                  <div className="status-section">
                    <h4>🎯 Head Pose</h4>
                    <div className="status-row">
                      <span className="status-label">Yaw</span>
                      <span className="status-value">{currentStatus.head_pose.yaw.toFixed(1)}°</span>
                    </div>
                    <div className="status-row">
                      <span className="status-label">Pitch</span>
                      <span className="status-value">{currentStatus.head_pose.pitch.toFixed(1)}°</span>
                    </div>
                    <div className="status-row">
                      <span className="status-label">Roll</span>
                      <span className="status-value">{currentStatus.head_pose.roll.toFixed(1)}°</span>
                    </div>
                  </div>
                )}

                <div className="status-section">
                  <h4>👁️ Gaze & Blink</h4>
                  <div className="status-row">
                    <span className="status-label">Gaze Direction</span>
                    <span className="status-value">
                      {getGazeIndicator(currentStatus.gaze_direction)} {currentStatus.gaze_direction || 'Unknown'}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Blink Detected</span>
                    <span className={`status-indicator ${currentStatus.blink_detected ? 'status-warning' : 'status-good'}`}>
                      {currentStatus.blink_detected ? '👁️ Yes' : '👀 No'}
                    </span>
                  </div>
                  {currentStatus.ear_value !== undefined && (
                    <div className="status-row">
                      <span className="status-label">EAR Value</span>
                      <span className="status-value">{currentStatus.ear_value.toFixed(3)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {!currentStatus && isMonitoring && (
              <div className="status-section">
                <p className="status-waiting">Waiting for data...</p>
              </div>
            )}

            {!isMonitoring && !currentStatus && (
              <div className="status-section">
                <p className="status-info">Start monitoring to see detection status</p>
              </div>
            )}
          </div>

          {/* Right Panel - Violations Log */}
          <div className="violations-panel">
            <div className="violations-header">
              <h3>📋 Event Log</h3>
              <button 
                className="clear-log-button" 
                onClick={handleClearLog}
                disabled={violations.length === 0}
              >
                Clear
              </button>
            </div>
            
            <div className="violations-list">
              {violations.length === 0 ? (
                <p className="no-violations">No events recorded</p>
              ) : (
                violations.map(violation => (
                  <div 
                    key={violation.id} 
                    className={`violation-item ${violation.severity}`}
                  >
                    <span className="violation-time">{formatTimestamp(violation.timestamp)}</span>
                    <span className="violation-type">[{violation.type}]</span>
                    <span className="violation-message">{violation.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="camera-test-controls">
          {!isMonitoring ? (
            <button
              className="control-button start-button"
              onClick={handleStartMonitoring}
              disabled={isLoading || !isElectron()}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Starting...
                </>
              ) : (
                <>
                  <span className="button-icon">▶️</span>
                  Start Monitoring
                </>
              )}
            </button>
          ) : (
            <button
              className="control-button stop-button"
              onClick={handleStopMonitoring}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Stopping...
                </>
              ) : (
                <>
                  <span className="button-icon">⏹️</span>
                  Stop Monitoring
                </>
              )}
            </button>
          )}
          
          <button className="control-button close-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Electron Warning */}
        {!isElectron() && (
          <div className="electron-warning">
            <span className="warning-icon">⚠️</span>
            <span>Camera monitoring requires the Electron app. Run <code>npm run dev</code> to test.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraTestModule;

