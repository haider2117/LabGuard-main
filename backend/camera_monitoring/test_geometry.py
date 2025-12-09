"""
Test script for Geometry Utilities

This script tests all geometry utility functions.
Usage:
    python test_geometry.py
"""

import sys
import numpy as np
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from camera_monitoring.utils import geometry
from camera_monitoring.utils.geometry import (
    ExponentialMovingAverage,
    MovingAverage,
)


def test_distance_functions():
    """Test distance measurement functions."""
    print("\n=== Distance Functions ===")
    
    # Test euclidean_distance
    p1 = np.array([0, 0])
    p2 = np.array([3, 4])
    dist = geometry.euclidean_distance(p1, p2)
    assert abs(dist - 5.0) < 1e-6, f"Expected 5.0, got {dist}"
    print(f"✓ euclidean_distance([0,0], [3,4]) = {dist}")
    
    # Test euclidean_distance_2d
    dist_2d = geometry.euclidean_distance_2d(0, 0, 3, 4)
    assert abs(dist_2d - 5.0) < 1e-6, f"Expected 5.0, got {dist_2d}"
    print(f"✓ euclidean_distance_2d(0,0,3,4) = {dist_2d}")
    
    # Test euclidean_distance_3d
    dist_3d = geometry.euclidean_distance_3d(0, 0, 0, 1, 2, 2)
    expected = 3.0
    assert abs(dist_3d - expected) < 1e-6, f"Expected {expected}, got {dist_3d}"
    print(f"✓ euclidean_distance_3d(0,0,0,1,2,2) = {dist_3d}")
    
    # Test point_to_line_distance
    point = np.array([1, 1])
    line_start = np.array([0, 0])
    line_end = np.array([2, 0])
    dist_line = geometry.point_to_line_distance(point, line_start, line_end)
    assert abs(dist_line - 1.0) < 1e-6, f"Expected 1.0, got {dist_line}"
    print(f"✓ point_to_line_distance([1,1], [0,0]->[2,0]) = {dist_line}")
    
    # Test midpoint
    mid = geometry.midpoint(p1, p2)
    expected_mid = np.array([1.5, 2.0])
    assert np.allclose(mid, expected_mid), f"Expected {expected_mid}, got {mid}"
    print(f"✓ midpoint([0,0], [3,4]) = {mid}")
    
    print("All distance function tests passed!")


def test_angle_functions():
    """Test angle calculation functions."""
    print("\n=== Angle Functions ===")
    
    # Test angle_between_vectors
    v1 = np.array([1, 0])
    v2 = np.array([0, 1])
    angle = geometry.angle_between_vectors(v1, v2)
    assert abs(angle - 90.0) < 1e-6, f"Expected 90.0, got {angle}"
    print(f"✓ angle_between_vectors([1,0], [0,1]) = {angle}°")
    
    # Test angle_between_vectors (parallel)
    v3 = np.array([2, 0])
    angle_parallel = geometry.angle_between_vectors(v1, v3)
    assert abs(angle_parallel - 0.0) < 1e-6, f"Expected 0.0, got {angle_parallel}"
    print(f"✓ angle_between_vectors([1,0], [2,0]) = {angle_parallel}°")
    
    # Test signed_angle_2d
    signed = geometry.signed_angle_2d(v1, v2)
    assert abs(signed - 90.0) < 1e-6, f"Expected 90.0, got {signed}"
    print(f"✓ signed_angle_2d([1,0], [0,1]) = {signed}°")
    
    # Test signed_angle_2d (clockwise)
    signed_neg = geometry.signed_angle_2d(v2, v1)
    assert abs(signed_neg - (-90.0)) < 1e-6, f"Expected -90.0, got {signed_neg}"
    print(f"✓ signed_angle_2d([0,1], [1,0]) = {signed_neg}°")
    
    # Test normalize_angle
    norm_angle = geometry.normalize_angle(270.0)
    assert abs(norm_angle - (-90.0)) < 1e-6, f"Expected -90.0, got {norm_angle}"
    print(f"✓ normalize_angle(270.0) = {norm_angle}°")
    
    # Test degrees_to_radians
    rad = geometry.degrees_to_radians(180.0)
    assert abs(rad - np.pi) < 1e-6, f"Expected π, got {rad}"
    print(f"✓ degrees_to_radians(180.0) = {rad}")
    
    # Test radians_to_degrees
    deg = geometry.radians_to_degrees(np.pi)
    assert abs(deg - 180.0) < 1e-6, f"Expected 180.0, got {deg}"
    print(f"✓ radians_to_degrees(π) = {deg}°")
    
    print("All angle function tests passed!")


def test_coordinate_transformations():
    """Test coordinate transformation functions."""
    print("\n=== Coordinate Transformations ===")
    
    image_width = 640
    image_height = 480
    
    # Test normalize_to_image_coords
    norm_point = np.array([0.5, 0.5])
    pixel_point = geometry.normalize_to_image_coords(norm_point, image_width, image_height)
    expected = np.array([320.0, 240.0])
    assert np.allclose(pixel_point[:2], expected), f"Expected {expected}, got {pixel_point}"
    print(f"✓ normalize_to_image_coords([0.5, 0.5]) = {pixel_point}")
    
    # Test image_to_normalized_coords
    norm_back = geometry.image_to_normalized_coords(pixel_point.copy(), image_width, image_height)
    assert np.allclose(norm_back[:2], norm_point), f"Expected {norm_point}, got {norm_back}"
    print(f"✓ image_to_normalized_coords([320, 240]) = {norm_back}")
    
    # Test landmarks_to_pixel_coords
    landmarks = np.array([[0.0, 0.0], [0.5, 0.5], [1.0, 1.0]])
    pixel_landmarks = geometry.landmarks_to_pixel_coords(landmarks, image_width, image_height)
    expected_landmarks = np.array([[0.0, 0.0], [320.0, 240.0], [640.0, 480.0]])
    assert np.allclose(pixel_landmarks, expected_landmarks), f"Mismatch in landmarks conversion"
    print(f"✓ landmarks_to_pixel_coords: converted 3 points correctly")
    
    print("All coordinate transformation tests passed!")


def test_head_pose_helpers():
    """Test head pose helper functions."""
    print("\n=== Head Pose Helpers ===")
    
    image_width = 640
    image_height = 480
    
    # Test create_camera_matrix
    cam_matrix = geometry.create_camera_matrix(image_width, image_height)
    assert cam_matrix.shape == (3, 3), f"Expected 3x3 matrix, got {cam_matrix.shape}"
    assert cam_matrix[0, 2] == 320.0, f"Expected cx=320, got {cam_matrix[0, 2]}"
    assert cam_matrix[1, 2] == 240.0, f"Expected cy=240, got {cam_matrix[1, 2]}"
    print(f"✓ create_camera_matrix: 3x3 matrix with cx=320, cy=240")
    
    # Test get_distortion_coefficients
    dist_coeffs = geometry.get_distortion_coefficients()
    assert dist_coeffs.shape == (4, 1), f"Expected (4,1), got {dist_coeffs.shape}"
    assert np.all(dist_coeffs == 0), "Expected zero distortion"
    print(f"✓ get_distortion_coefficients: zero distortion")
    
    # Test rotation_vector_to_matrix and back
    rvec = np.array([[0.1], [0.2], [0.3]], dtype=np.float64)
    R = geometry.rotation_vector_to_matrix(rvec)
    assert R.shape == (3, 3), f"Expected 3x3 matrix, got {R.shape}"
    assert geometry.is_valid_rotation_matrix(R), "Invalid rotation matrix"
    print(f"✓ rotation_vector_to_matrix: valid 3x3 rotation matrix")
    
    rvec_back = geometry.rotation_matrix_to_vector(R)
    assert np.allclose(rvec.flatten(), rvec_back.flatten(), atol=1e-6), "Rotation vector mismatch"
    print(f"✓ rotation_matrix_to_vector: matches original")
    
    # Test euler_angles_from_rotation_matrix
    yaw, pitch, roll = geometry.euler_angles_from_rotation_matrix(R)
    print(f"✓ euler_angles_from_rotation_matrix: yaw={yaw:.2f}°, pitch={pitch:.2f}°, roll={roll:.2f}°")
    
    # Test is_valid_rotation_matrix
    identity = np.eye(3)
    assert geometry.is_valid_rotation_matrix(identity), "Identity should be valid"
    print(f"✓ is_valid_rotation_matrix: identity matrix is valid")
    
    invalid_matrix = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]], dtype=np.float64)
    assert not geometry.is_valid_rotation_matrix(invalid_matrix), "Random matrix should be invalid"
    print(f"✓ is_valid_rotation_matrix: random matrix is invalid")
    
    print("All head pose helper tests passed!")


def test_ear_calculations():
    """Test Eye Aspect Ratio calculations."""
    print("\n=== EAR Calculations ===")
    
    # Create mock eye landmarks (open eye)
    # Order: outer, inner, top, bottom, top_inner, bottom_inner
    eye_open = np.array([
        [0, 10],    # outer
        [30, 10],   # inner
        [15, 0],    # top
        [15, 20],   # bottom
        [20, 2],    # top_inner
        [20, 18]    # bottom_inner
    ])
    
    ear_open = geometry.calculate_ear(eye_open)
    assert ear_open > 0.3, f"Open eye EAR should be > 0.3, got {ear_open}"
    print(f"✓ calculate_ear (open eye) = {ear_open:.3f}")
    
    # Create mock eye landmarks (closed eye)
    eye_closed = np.array([
        [0, 10],    # outer
        [30, 10],   # inner
        [15, 9],    # top (close to center)
        [15, 11],   # bottom (close to center)
        [20, 9],    # top_inner
        [20, 11]    # bottom_inner
    ])
    
    ear_closed = geometry.calculate_ear(eye_closed)
    assert ear_closed < 0.15, f"Closed eye EAR should be < 0.15, got {ear_closed}"
    print(f"✓ calculate_ear (closed eye) = {ear_closed:.3f}")
    
    # Test calculate_ear_from_coords
    ear_coords = geometry.calculate_ear_from_coords(
        eye_open[0], eye_open[1], eye_open[2], eye_open[3], eye_open[4], eye_open[5]
    )
    assert abs(ear_coords - ear_open) < 1e-6, f"EAR mismatch: {ear_coords} vs {ear_open}"
    print(f"✓ calculate_ear_from_coords matches calculate_ear")
    
    print("All EAR calculation tests passed!")


def test_bounding_box_utilities():
    """Test bounding box utility functions."""
    print("\n=== Bounding Box Utilities ===")
    
    # Test bounding_box_from_landmarks
    landmarks = np.array([
        [10, 20],
        [50, 30],
        [30, 60],
        [20, 40]
    ])
    
    bbox = geometry.bounding_box_from_landmarks(landmarks)
    x, y, w, h = bbox
    assert x == 10 and y == 20, f"Expected origin (10, 20), got ({x}, {y})"
    assert w == 40 and h == 40, f"Expected size (40, 40), got ({w}, {h})"
    print(f"✓ bounding_box_from_landmarks = (x={x}, y={y}, w={w}, h={h})")
    
    # Test with padding
    bbox_pad = geometry.bounding_box_from_landmarks(landmarks, padding=0.1)
    x_p, y_p, w_p, h_p = bbox_pad
    assert w_p > w and h_p > h, "Padded box should be larger"
    print(f"✓ bounding_box_from_landmarks (10% padding) = (x={x_p}, y={y_p}, w={w_p}, h={h_p})")
    
    # Test box_iou
    box1 = (0, 0, 10, 10)
    box2 = (5, 5, 10, 10)
    iou = geometry.box_iou(box1, box2)
    expected_iou = 25.0 / 175.0  # intersection=5*5, union=100+100-25
    assert abs(iou - expected_iou) < 1e-6, f"Expected IoU {expected_iou:.4f}, got {iou:.4f}"
    print(f"✓ box_iou overlapping boxes = {iou:.4f}")
    
    # Test non-overlapping boxes
    box3 = (20, 20, 10, 10)
    iou_none = geometry.box_iou(box1, box3)
    assert iou_none == 0.0, f"Expected IoU 0.0, got {iou_none}"
    print(f"✓ box_iou non-overlapping = {iou_none:.4f}")
    
    print("All bounding box utility tests passed!")


def test_smoothing_utilities():
    """Test smoothing utility classes."""
    print("\n=== Smoothing Utilities ===")
    
    # Test ExponentialMovingAverage
    ema = ExponentialMovingAverage(window=3)
    assert ema.get() is None, "Initial EMA should be None"
    
    result = ema.update(10.0)
    assert result == 10.0, f"First value should be 10.0, got {result}"
    print(f"✓ EMA initial value = {result}")
    
    result = ema.update(20.0)
    # alpha = 2/(3+1) = 0.5
    # ema = 0.5 * 20 + 0.5 * 10 = 15
    assert abs(result - 15.0) < 1e-6, f"Expected 15.0, got {result}"
    print(f"✓ EMA second value = {result}")
    
    ema.reset()
    assert ema.get() is None, "After reset, EMA should be None"
    print(f"✓ EMA reset works")
    
    # Test MovingAverage
    ma = MovingAverage(window=3)
    assert ma.get() is None, "Initial MA should be None"
    
    ma.update(10.0)
    ma.update(20.0)
    result = ma.update(30.0)
    expected = 20.0  # (10+20+30)/3
    assert abs(result - expected) < 1e-6, f"Expected {expected}, got {result}"
    print(f"✓ MA (10, 20, 30) = {result}")
    
    # Add fourth value - should drop first
    result = ma.update(40.0)
    expected = 30.0  # (20+30+40)/3
    assert abs(result - expected) < 1e-6, f"Expected {expected}, got {result}"
    print(f"✓ MA after 4th value (window=3) = {result}")
    
    ma.reset()
    assert ma.get() is None, "After reset, MA should be None"
    print(f"✓ MA reset works")
    
    print("All smoothing utility tests passed!")


def test_validation_utilities():
    """Test validation utility functions."""
    print("\n=== Validation Utilities ===")
    
    image_width = 640
    image_height = 480
    
    # Test is_point_in_image
    point_in = np.array([320, 240])
    assert geometry.is_point_in_image(point_in, image_width, image_height)
    print(f"✓ is_point_in_image([320, 240]) = True")
    
    point_out = np.array([700, 240])
    assert not geometry.is_point_in_image(point_out, image_width, image_height)
    print(f"✓ is_point_in_image([700, 240]) = False")
    
    # Test clip_point_to_image
    point_clip = np.array([700, -50])
    clipped = geometry.clip_point_to_image(point_clip, image_width, image_height)
    assert clipped[0] == 639 and clipped[1] == 0, f"Expected [639, 0], got {clipped}"
    print(f"✓ clip_point_to_image([700, -50]) = {clipped}")
    
    print("All validation utility tests passed!")


def run_all_tests():
    """Run all geometry tests."""
    print("=" * 60)
    print("GEOMETRY UTILITIES TEST SUITE")
    print("=" * 60)
    
    try:
        test_distance_functions()
        test_angle_functions()
        test_coordinate_transformations()
        test_head_pose_helpers()
        test_ear_calculations()
        test_bounding_box_utilities()
        test_smoothing_utilities()
        test_validation_utilities()
        
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED!")
        print("=" * 60)
        return True
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n✗ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

