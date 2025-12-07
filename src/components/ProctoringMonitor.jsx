import { useEffect, useRef, useState } from 'react';
import { olympiadAPI } from '../services/api';
import { CAMERA_CAPTURE_INTERVAL } from '../utils/constants';
import './ProctoringMonitor.css';

const ProctoringMonitor = ({ olympiadId, userId }) => {
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const screenCanvasRef = useRef(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [screenError, setScreenError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const isCapturingRef = useRef(false);

  useEffect(() => {
    if (!consentGiven) return;

    let cameraStream = null;
    let screenStream = null;
    let captureInterval = null;

    const startMonitoring = async () => {
      // Start camera
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
        
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = cameraStream;
          setCameraActive(true);
          setCameraError(null);
        }
      } catch (err) {
        setCameraError('Camera access denied');
        console.error('Camera error:', err);
      }

      // Start screen capture
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            mediaSource: 'screen',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
          setScreenActive(true);
          setScreenError(null);
        }

        // Handle screen share stop
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          setScreenError('Screen sharing stopped');
          setScreenActive(false);
        });
      } catch (err) {
        setScreenError('Screen sharing denied or unavailable');
        console.error('Screen error:', err);
      }

      // Periodic capture - start after streams are set up
      const startCapture = () => {
        captureInterval = setInterval(() => {
          captureScreenshots();
        }, CAMERA_CAPTURE_INTERVAL);

        // Initial capture
        setTimeout(() => {
          captureScreenshots();
        }, 5000);
      };

      // Start capturing if we have at least one stream
      if (cameraStream || screenStream) {
        startCapture();
      }
    };

    const captureScreenshots = async () => {
      if (isCapturingRef.current) return;
      
      isCapturingRef.current = true;
      setIsCapturing(true);
      const captures = [];

      // Capture camera
      if (cameraVideoRef.current && cameraCanvasRef.current && cameraVideoRef.current.srcObject) {
        try {
          const canvas = cameraCanvasRef.current;
          const video = cameraVideoRef.current;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
          });

          if (blob) {
            captures.push({
              type: 'camera',
              blob,
              filename: `camera-${Date.now()}.jpg`
            });
          }
        } catch (err) {
          console.error('Camera capture error:', err);
        }
      }

      // Capture screen
      if (screenVideoRef.current && screenCanvasRef.current && screenVideoRef.current.srcObject) {
        try {
          const canvas = screenCanvasRef.current;
          const video = screenVideoRef.current;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.85);
          });

          if (blob) {
            captures.push({
              type: 'screen',
              blob,
              filename: `screen-${Date.now()}.jpg`
            });
          }
        } catch (err) {
          console.error('Screen capture error:', err);
        }
      }

      // Upload captures
      for (const capture of captures) {
        try {
          const formData = new FormData();
          formData.append('image', capture.blob, capture.filename);
          formData.append('captureType', capture.type); // Backend expects 'captureType'
          formData.append('olympiadId', olympiadId);
          // userId is not needed - backend gets it from JWT token

          await olympiadAPI.uploadCameraCapture(formData);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
        }
      }

      isCapturingRef.current = false;
      setIsCapturing(false);
    };

    startMonitoring();

    return () => {
      if (captureInterval) clearInterval(captureInterval);
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [consentGiven, olympiadId, userId]);

  if (!consentGiven) {
    return (
      <div className="proctoring-consent">
        <div className="consent-card card">
          <h3>Proctoring Consent</h3>
          <p>This olympiad requires monitoring for integrity:</p>
          <ul>
            <li>✓ Front camera will be recorded</li>
            <li>✓ Screen activity will be captured</li>
            <li>✓ Periodic screenshots will be taken</li>
            <li>✓ All data is securely stored</li>
          </ul>
          <p className="consent-warning">
            You must grant camera and screen sharing permissions to continue.
          </p>
          <button 
            className="button-primary"
            onClick={() => setConsentGiven(true)}
          >
            I Agree & Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="proctoring-monitor">
      <div className="monitor-camera">
        <div className="monitor-header">
          <span className="monitor-title">Camera</span>
          {cameraActive && <div className="monitor-indicator" />}
        </div>
        {cameraError ? (
          <div className="monitor-error">
            <div className="error-icon">📷</div>
            <div className="error-text">{cameraError}</div>
          </div>
        ) : (
          <div className="monitor-preview">
            <video
              ref={cameraVideoRef}
              autoPlay
              muted
              playsInline
              className="monitor-video camera-video"
            />
            {isCapturing && <div className="capture-overlay"><div className="capture-pulse"></div></div>}
          </div>
        )}
        <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />
      </div>

      <div className="monitor-screen">
        <div className="monitor-header">
          <span className="monitor-title">Screen</span>
          {screenActive && <div className="monitor-indicator" />}
        </div>
        {screenError ? (
          <div className="monitor-error">
            <div className="error-icon">🖥️</div>
            <div className="error-text">{screenError}</div>
          </div>
        ) : (
          <div className="monitor-preview">
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              playsInline
              className="monitor-video screen-video"
            />
            {isCapturing && <div className="capture-overlay"><div className="capture-pulse"></div></div>}
          </div>
        )}
        <canvas ref={screenCanvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ProctoringMonitor;

