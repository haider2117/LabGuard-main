"""
Detection modules for camera monitoring.

This package contains:
- ObjectDetector: YOLOv8-based object detection (phones, persons)
- FaceAnalyzer: MediaPipe-based face detection and landmark extraction
- GazeEstimator: Gaze direction and blink detection
"""

from .object_detector import ObjectDetector, create_detector

__all__ = ['ObjectDetector', 'create_detector']

