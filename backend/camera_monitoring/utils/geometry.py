"""
Geometry Utilities for Camera Monitoring

This module provides geometric calculations for:
- Head pose estimation helpers
- Coordinate transformations
- Angle calculations
- Distance measurements
- Eye Aspect Ratio (EAR) calculations

These utilities are used by FaceAnalyzer and GazeEstimator.
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional, Union
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS
# =============================================================================

# Standard 3D face model for head pose estimation (canonical face)
# Coordinate system: X-right, Y-down, Z-forward (away from camera)
# Centered at nose tip
CANONICAL_FACE_MODEL = np.array([
    (0.0, 0.0, 0.0),           # Nose tip - origin
    (43.3, -32.7, -26.0),      # Right eye outer corner
    (-43.3, -32.7, -26.0),     # Left eye outer corner
    (0.0, 71.7, -15.0),        # Chin tip
    (-28.9, 28.9, -24.1),      # Left mouth corner
    (28.9, 28.9, -24.1),       # Right mouth corner
], dtype=np.float64)


# =============================================================================
# DISTANCE MEASUREMENTS
# =============================================================================

def euclidean_distance(p1: np.ndarray, p2: np.ndarray) -> float:
    """
    Calculate Euclidean distance between two points.
    
    Args:
        p1: First point as numpy array (any dimension)
        p2: Second point as numpy array (same dimension as p1)
    
    Returns:
        float: Euclidean distance between points
    """
    return float(np.linalg.norm(np.array(p1) - np.array(p2)))


def euclidean_distance_2d(x1: float, y1: float, x2: float, y2: float) -> float:
    """
    Calculate 2D Euclidean distance between two points.
    
    Args:
        x1, y1: Coordinates of first point
        x2, y2: Coordinates of second point
    
    Returns:
        float: Euclidean distance
    """
    return float(np.sqrt((x2 - x1)**2 + (y2 - y1)**2))


def euclidean_distance_3d(
    x1: float, y1: float, z1: float,
    x2: float, y2: float, z2: float
) -> float:
    """
    Calculate 3D Euclidean distance between two points.
    
    Args:
        x1, y1, z1: Coordinates of first point
        x2, y2, z2: Coordinates of second point
    
    Returns:
        float: Euclidean distance
    """
    return float(np.sqrt((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2))


def point_to_line_distance(
    point: np.ndarray,
    line_start: np.ndarray,
    line_end: np.ndarray
) -> float:
    """
    Calculate perpendicular distance from a point to a line segment.
    
    Args:
        point: The point (2D or 3D)
        line_start: Start of line segment
        line_end: End of line segment
    
    Returns:
        float: Perpendicular distance from point to line
    """
    point = np.array(point, dtype=np.float64)
    line_start = np.array(line_start, dtype=np.float64)
    line_end = np.array(line_end, dtype=np.float64)
    
    line_vec = line_end - line_start
    line_len = np.linalg.norm(line_vec)
    
    if line_len < 1e-10:
        return euclidean_distance(point, line_start)
    
    # Project point onto line
    t = np.dot(point - line_start, line_vec) / (line_len ** 2)
    t = max(0, min(1, t))  # Clamp to segment
    
    projection = line_start + t * line_vec
    return euclidean_distance(point, projection)


def midpoint(p1: np.ndarray, p2: np.ndarray) -> np.ndarray:
    """
    Calculate midpoint between two points.
    
    Args:
        p1: First point
        p2: Second point
    
    Returns:
        np.ndarray: Midpoint coordinates
    """
    return (np.array(p1) + np.array(p2)) / 2.0


# =============================================================================
# ANGLE CALCULATIONS
# =============================================================================

def angle_between_vectors(v1: np.ndarray, v2: np.ndarray) -> float:
    """
    Calculate angle between two vectors in degrees.
    
    Args:
        v1: First vector
        v2: Second vector
    
    Returns:
        float: Angle in degrees (0 to 180)
    """
    v1 = np.array(v1, dtype=np.float64)
    v2 = np.array(v2, dtype=np.float64)
    
    # Normalize vectors
    v1_norm = np.linalg.norm(v1)
    v2_norm = np.linalg.norm(v2)
    
    if v1_norm < 1e-10 or v2_norm < 1e-10:
        return 0.0
    
    v1_unit = v1 / v1_norm
    v2_unit = v2 / v2_norm
    
    # Dot product gives cos(angle)
    dot = np.clip(np.dot(v1_unit, v2_unit), -1.0, 1.0)
    angle_rad = np.arccos(dot)
    
    return float(np.degrees(angle_rad))


def signed_angle_2d(v1: np.ndarray, v2: np.ndarray) -> float:
    """
    Calculate signed angle from v1 to v2 in 2D (counterclockwise positive).
    
    Args:
        v1: First 2D vector
        v2: Second 2D vector
    
    Returns:
        float: Signed angle in degrees (-180 to 180)
    """
    # Cross product in 2D gives sin(angle) * |v1| * |v2|
    cross = v1[0] * v2[1] - v1[1] * v2[0]
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    
    angle_rad = np.arctan2(cross, dot)
    return float(np.degrees(angle_rad))


def normalize_angle(angle: float, min_val: float = -180.0, max_val: float = 180.0) -> float:
    """
    Normalize angle to specified range.
    
    Args:
        angle: Angle in degrees
        min_val: Minimum value (default: -180)
        max_val: Maximum value (default: 180)
    
    Returns:
        float: Normalized angle
    """
    range_size = max_val - min_val
    while angle < min_val:
        angle += range_size
    while angle >= max_val:
        angle -= range_size
    return float(angle)


def degrees_to_radians(degrees: float) -> float:
    """Convert degrees to radians."""
    return float(np.radians(degrees))


def radians_to_degrees(radians: float) -> float:
    """Convert radians to degrees."""
    return float(np.degrees(radians))


# =============================================================================
# COORDINATE TRANSFORMATIONS
# =============================================================================

def normalize_to_image_coords(
    normalized_point: np.ndarray,
    image_width: int,
    image_height: int
) -> np.ndarray:
    """
    Convert normalized coordinates (0-1) to image pixel coordinates.
    
    Args:
        normalized_point: Point with coordinates in [0, 1] range
        image_width: Image width in pixels
        image_height: Image height in pixels
    
    Returns:
        np.ndarray: Point in pixel coordinates
    """
    point = np.array(normalized_point, dtype=np.float64)
    if len(point) >= 2:
        point[0] *= image_width
        point[1] *= image_height
    return point


def image_to_normalized_coords(
    pixel_point: np.ndarray,
    image_width: int,
    image_height: int
) -> np.ndarray:
    """
    Convert image pixel coordinates to normalized coordinates (0-1).
    
    Args:
        pixel_point: Point in pixel coordinates
        image_width: Image width in pixels
        image_height: Image height in pixels
    
    Returns:
        np.ndarray: Point with coordinates in [0, 1] range
    """
    point = np.array(pixel_point, dtype=np.float64)
    if len(point) >= 2 and image_width > 0 and image_height > 0:
        point[0] /= image_width
        point[1] /= image_height
    return point


def landmarks_to_pixel_coords(
    landmarks: np.ndarray,
    image_width: int,
    image_height: int
) -> np.ndarray:
    """
    Convert array of normalized landmarks to pixel coordinates.
    
    Args:
        landmarks: Array of normalized landmarks (Nx2 or Nx3)
        image_width: Image width in pixels
        image_height: Image height in pixels
    
    Returns:
        np.ndarray: Landmarks in pixel coordinates
    """
    landmarks = np.array(landmarks, dtype=np.float64)
    result = landmarks.copy()
    
    if len(result.shape) == 2 and result.shape[1] >= 2:
        result[:, 0] *= image_width
        result[:, 1] *= image_height
    
    return result


# =============================================================================
# HEAD POSE HELPERS
# =============================================================================

def create_camera_matrix(
    image_width: int,
    image_height: int,
    fov_degrees: float = 60.0
) -> np.ndarray:
    """
    Create camera intrinsic matrix for pose estimation.
    
    Args:
        image_width: Image width in pixels
        image_height: Image height in pixels
        fov_degrees: Horizontal field of view in degrees (default: 60°)
    
    Returns:
        np.ndarray: 3x3 camera matrix
    """
    # Focal length from FOV: f = (width/2) / tan(fov/2)
    fov_rad = np.radians(fov_degrees)
    focal_length = (image_width / 2.0) / np.tan(fov_rad / 2.0)
    
    # If calculation fails, use image width as approximation
    if focal_length <= 0 or not np.isfinite(focal_length):
        focal_length = float(image_width)
    
    center_x = image_width / 2.0
    center_y = image_height / 2.0
    
    return np.array([
        [focal_length, 0.0, center_x],
        [0.0, focal_length, center_y],
        [0.0, 0.0, 1.0]
    ], dtype=np.float64)


def get_distortion_coefficients() -> np.ndarray:
    """
    Get distortion coefficients (assuming no distortion).
    
    Returns:
        np.ndarray: Zero distortion coefficients (4x1)
    """
    return np.zeros((4, 1), dtype=np.float64)


def rotation_vector_to_matrix(rotation_vector: np.ndarray) -> np.ndarray:
    """
    Convert rotation vector (Rodrigues) to rotation matrix.
    
    Args:
        rotation_vector: 3x1 rotation vector
    
    Returns:
        np.ndarray: 3x3 rotation matrix
    """
    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    return rotation_matrix


def rotation_matrix_to_vector(rotation_matrix: np.ndarray) -> np.ndarray:
    """
    Convert rotation matrix to rotation vector (Rodrigues).
    
    Args:
        rotation_matrix: 3x3 rotation matrix
    
    Returns:
        np.ndarray: 3x1 rotation vector
    """
    rotation_vector, _ = cv2.Rodrigues(rotation_matrix)
    return rotation_vector


def euler_angles_from_rotation_matrix(rotation_matrix: np.ndarray) -> Tuple[float, float, float]:
    """
    Extract Euler angles (yaw, pitch, roll) from rotation matrix.
    
    Uses ZYX rotation order (common in computer vision).
    
    Args:
        rotation_matrix: 3x3 rotation matrix
    
    Returns:
        Tuple[float, float, float]: (yaw, pitch, roll) in degrees
    """
    R = rotation_matrix
    
    # Check for gimbal lock
    sy = np.sqrt(R[0, 0]**2 + R[1, 0]**2)
    
    singular = sy < 1e-6
    
    if not singular:
        yaw = np.arctan2(R[1, 0], R[0, 0])
        pitch = np.arctan2(-R[2, 0], sy)
        roll = np.arctan2(R[2, 1], R[2, 2])
    else:
        yaw = np.arctan2(-R[1, 2], R[1, 1])
        pitch = np.arctan2(-R[2, 0], sy)
        roll = 0.0
    
    return (
        float(np.degrees(yaw)),
        float(np.degrees(pitch)),
        float(np.degrees(roll))
    )


def project_3d_to_2d(
    points_3d: np.ndarray,
    rotation_vector: np.ndarray,
    translation_vector: np.ndarray,
    camera_matrix: np.ndarray,
    dist_coeffs: Optional[np.ndarray] = None
) -> np.ndarray:
    """
    Project 3D points to 2D image coordinates.
    
    Args:
        points_3d: Nx3 array of 3D points
        rotation_vector: 3x1 rotation vector
        translation_vector: 3x1 translation vector
        camera_matrix: 3x3 camera matrix
        dist_coeffs: Distortion coefficients (optional)
    
    Returns:
        np.ndarray: Nx2 array of 2D points
    """
    if dist_coeffs is None:
        dist_coeffs = get_distortion_coefficients()
    
    points_3d = np.array(points_3d, dtype=np.float64)
    points_2d, _ = cv2.projectPoints(
        points_3d, rotation_vector, translation_vector,
        camera_matrix, dist_coeffs
    )
    
    return points_2d.reshape(-1, 2)


def solve_head_pose(
    image_points: np.ndarray,
    model_points: np.ndarray,
    camera_matrix: np.ndarray,
    dist_coeffs: Optional[np.ndarray] = None,
    method: int = cv2.SOLVEPNP_ITERATIVE
) -> Optional[Tuple[np.ndarray, np.ndarray]]:
    """
    Solve PnP problem for head pose estimation.
    
    Args:
        image_points: Nx2 array of 2D image points
        model_points: Nx3 array of 3D model points
        camera_matrix: 3x3 camera matrix
        dist_coeffs: Distortion coefficients (optional)
        method: solvePnP method (default: ITERATIVE)
    
    Returns:
        Tuple[np.ndarray, np.ndarray]: (rotation_vector, translation_vector) or None if failed
    """
    if dist_coeffs is None:
        dist_coeffs = get_distortion_coefficients()
    
    try:
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points.astype(np.float64),
            image_points.astype(np.float64),
            camera_matrix,
            dist_coeffs,
            flags=method
        )
        
        if success:
            return rotation_vector, translation_vector
        else:
            logger.warning("solvePnP failed")
            return None
            
    except Exception as e:
        logger.error(f"Error in solvePnP: {e}")
        return None


def calculate_head_pose_projection(
    rotation_vector: np.ndarray,
    translation_vector: np.ndarray,
    camera_matrix: np.ndarray,
    reference_2d: np.ndarray,
    dist_coeffs: Optional[np.ndarray] = None
) -> Dict[str, float]:
    """
    Calculate head pose angles using projection method.
    
    Projects 3D direction vectors to get intuitive yaw/pitch/roll.
    
    Args:
        rotation_vector: 3x1 rotation vector
        translation_vector: 3x1 translation vector
        camera_matrix: 3x3 camera matrix
        reference_2d: Reference 2D point (e.g., nose tip in image)
        dist_coeffs: Distortion coefficients (optional)
    
    Returns:
        Dict with 'yaw', 'pitch', 'roll' in degrees
    """
    if dist_coeffs is None:
        dist_coeffs = get_distortion_coefficients()
    
    # Define axis points in 3D (relative to face origin)
    axis_length = 100.0
    axis_points_3d = np.array([
        [0.0, 0.0, axis_length],   # Forward (nose direction)
        [0.0, -axis_length, 0.0],  # Up (above head in face coords)
    ], dtype=np.float64)
    
    # Project to 2D
    axis_points_2d = project_3d_to_2d(
        axis_points_3d, rotation_vector, translation_vector,
        camera_matrix, dist_coeffs
    )
    
    nose_tip_2d = np.array(reference_2d, dtype=np.float64)
    nose_end_2d = axis_points_2d[0]
    head_top_2d = axis_points_2d[1]
    
    # Calculate direction vectors
    dx_nose = nose_end_2d[0] - nose_tip_2d[0]
    dy_nose = nose_end_2d[1] - nose_tip_2d[1]
    
    dx_up = head_top_2d[0] - nose_tip_2d[0]
    dy_up = head_top_2d[1] - nose_tip_2d[1]
    
    # Yaw: horizontal angle (positive = looking right)
    yaw_deg = np.degrees(np.arctan2(dx_nose, axis_length))
    
    # Pitch: vertical angle (positive = looking up)
    # Note: in image coords, Y increases downward
    pitch_deg = np.degrees(np.arctan2(-dy_nose, axis_length))
    
    # Roll: angle of head's up-vector relative to image vertical
    # atan2(dx, -dy) gives angle from vertical, positive = clockwise tilt
    roll_deg = np.degrees(np.arctan2(dx_up, -dy_up))
    
    return {
        'yaw': float(yaw_deg),
        'pitch': float(pitch_deg),
        'roll': float(roll_deg)
    }


# =============================================================================
# EYE ASPECT RATIO (EAR) CALCULATIONS
# =============================================================================

def calculate_ear(
    eye_landmarks: np.ndarray,
    outer_idx: int = 0,
    inner_idx: int = 1,
    top_idx: int = 2,
    bottom_idx: int = 3,
    top_inner_idx: int = 4,
    bottom_inner_idx: int = 5
) -> float:
    """
    Calculate Eye Aspect Ratio (EAR) from eye landmarks.
    
    EAR = (vertical_1 + vertical_2) / (2 * horizontal)
    
    Args:
        eye_landmarks: Array of eye landmarks (at least 6 points)
        outer_idx: Index of outer corner
        inner_idx: Index of inner corner
        top_idx: Index of top point
        bottom_idx: Index of bottom point
        top_inner_idx: Index of top inner point
        bottom_inner_idx: Index of bottom inner point
    
    Returns:
        float: Eye Aspect Ratio (higher = more open)
    """
    try:
        eye = np.array(eye_landmarks)
        
        # Vertical distances
        v1 = euclidean_distance(eye[top_idx], eye[bottom_idx])
        v2 = euclidean_distance(eye[top_inner_idx], eye[bottom_inner_idx])
        
        # Horizontal distance
        h = euclidean_distance(eye[outer_idx], eye[inner_idx])
        
        if h < 1e-6:
            return 0.0
        
        ear = (v1 + v2) / (2.0 * h)
        return float(ear)
        
    except Exception as e:
        logger.warning(f"Error calculating EAR: {e}")
        return 0.0


def calculate_ear_from_coords(
    outer: np.ndarray,
    inner: np.ndarray,
    top: np.ndarray,
    bottom: np.ndarray,
    top_inner: np.ndarray,
    bottom_inner: np.ndarray
) -> float:
    """
    Calculate Eye Aspect Ratio from individual landmark coordinates.
    
    Args:
        outer: Outer corner coordinates
        inner: Inner corner coordinates
        top: Top point coordinates
        bottom: Bottom point coordinates
        top_inner: Top inner point coordinates
        bottom_inner: Bottom inner point coordinates
    
    Returns:
        float: Eye Aspect Ratio
    """
    v1 = euclidean_distance(top, bottom)
    v2 = euclidean_distance(top_inner, bottom_inner)
    h = euclidean_distance(outer, inner)
    
    if h < 1e-6:
        return 0.0
    
    return float((v1 + v2) / (2.0 * h))


# =============================================================================
# BOUNDING BOX UTILITIES
# =============================================================================

def bounding_box_from_landmarks(
    landmarks: np.ndarray,
    padding: float = 0.0
) -> Tuple[int, int, int, int]:
    """
    Calculate bounding box from landmarks.
    
    Args:
        landmarks: Nx2 array of landmarks
        padding: Padding as fraction of box size (0.1 = 10%)
    
    Returns:
        Tuple[int, int, int, int]: (x, y, width, height)
    """
    landmarks = np.array(landmarks)
    
    x_min = np.min(landmarks[:, 0])
    x_max = np.max(landmarks[:, 0])
    y_min = np.min(landmarks[:, 1])
    y_max = np.max(landmarks[:, 1])
    
    width = x_max - x_min
    height = y_max - y_min
    
    # Add padding
    pad_x = width * padding
    pad_y = height * padding
    
    x = int(x_min - pad_x)
    y = int(y_min - pad_y)
    w = int(width + 2 * pad_x)
    h = int(height + 2 * pad_y)
    
    return (x, y, w, h)


def box_iou(box1: Tuple[int, int, int, int], box2: Tuple[int, int, int, int]) -> float:
    """
    Calculate Intersection over Union (IoU) for two bounding boxes.
    
    Args:
        box1: First box (x, y, width, height)
        box2: Second box (x, y, width, height)
    
    Returns:
        float: IoU value (0 to 1)
    """
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2
    
    # Calculate intersection
    inter_x1 = max(x1, x2)
    inter_y1 = max(y1, y2)
    inter_x2 = min(x1 + w1, x2 + w2)
    inter_y2 = min(y1 + h1, y2 + h2)
    
    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0
    
    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    
    # Calculate union
    area1 = w1 * h1
    area2 = w2 * h2
    union_area = area1 + area2 - inter_area
    
    if union_area <= 0:
        return 0.0
    
    return float(inter_area / union_area)


# =============================================================================
# SMOOTHING UTILITIES
# =============================================================================

class ExponentialMovingAverage:
    """Exponential Moving Average (EMA) filter for smoothing values."""
    
    def __init__(self, window: int = 5):
        """
        Initialize EMA filter.
        
        Args:
            window: Equivalent window size for smoothing
        """
        self.alpha = 2.0 / (window + 1.0)
        self.value: Optional[float] = None
    
    def update(self, new_value: float) -> float:
        """
        Update with new value and return smoothed result.
        
        Args:
            new_value: New value to incorporate
        
        Returns:
            float: Smoothed value
        """
        if self.value is None:
            self.value = new_value
        else:
            self.value = self.alpha * new_value + (1.0 - self.alpha) * self.value
        return self.value
    
    def reset(self):
        """Reset the filter."""
        self.value = None
    
    def get(self) -> Optional[float]:
        """Get current smoothed value."""
        return self.value


class MovingAverage:
    """Simple Moving Average filter."""
    
    def __init__(self, window: int = 5):
        """
        Initialize moving average filter.
        
        Args:
            window: Window size
        """
        self.window = window
        self.values: List[float] = []
    
    def update(self, new_value: float) -> float:
        """
        Update with new value and return averaged result.
        
        Args:
            new_value: New value to incorporate
        
        Returns:
            float: Averaged value
        """
        self.values.append(new_value)
        if len(self.values) > self.window:
            self.values.pop(0)
        return float(np.mean(self.values))
    
    def reset(self):
        """Reset the filter."""
        self.values = []
    
    def get(self) -> Optional[float]:
        """Get current averaged value."""
        if not self.values:
            return None
        return float(np.mean(self.values))


# =============================================================================
# VALIDATION UTILITIES
# =============================================================================

def is_point_in_image(
    point: np.ndarray,
    image_width: int,
    image_height: int
) -> bool:
    """
    Check if point is within image bounds.
    
    Args:
        point: Point coordinates (x, y)
        image_width: Image width
        image_height: Image height
    
    Returns:
        bool: True if point is within bounds
    """
    x, y = point[0], point[1]
    return 0 <= x < image_width and 0 <= y < image_height


def clip_point_to_image(
    point: np.ndarray,
    image_width: int,
    image_height: int
) -> np.ndarray:
    """
    Clip point coordinates to image bounds.
    
    Args:
        point: Point coordinates
        image_width: Image width
        image_height: Image height
    
    Returns:
        np.ndarray: Clipped point
    """
    point = np.array(point, dtype=np.float64)
    point[0] = np.clip(point[0], 0, image_width - 1)
    point[1] = np.clip(point[1], 0, image_height - 1)
    return point


def is_valid_rotation_matrix(R: np.ndarray, tolerance: float = 1e-6) -> bool:
    """
    Check if matrix is a valid rotation matrix (orthogonal with det=1).
    
    Args:
        R: 3x3 matrix to check
        tolerance: Numerical tolerance
    
    Returns:
        bool: True if valid rotation matrix
    """
    if R.shape != (3, 3):
        return False
    
    # Check orthogonality: R * R^T = I
    should_be_identity = np.dot(R, R.T)
    identity = np.eye(3)
    
    if not np.allclose(should_be_identity, identity, atol=tolerance):
        return False
    
    # Check determinant = 1
    det = np.linalg.det(R)
    if not np.isclose(det, 1.0, atol=tolerance):
        return False
    
    return True

