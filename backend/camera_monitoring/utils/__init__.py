"""
Utility modules for camera monitoring.

This package contains:
- geometry: Geometric calculations for head pose, gaze, etc.
"""

from .geometry import (
    # Distance measurements
    euclidean_distance,
    euclidean_distance_2d,
    euclidean_distance_3d,
    point_to_line_distance,
    midpoint,
    
    # Angle calculations
    angle_between_vectors,
    signed_angle_2d,
    normalize_angle,
    degrees_to_radians,
    radians_to_degrees,
    
    # Coordinate transformations
    normalize_to_image_coords,
    image_to_normalized_coords,
    landmarks_to_pixel_coords,
    
    # Head pose helpers
    create_camera_matrix,
    get_distortion_coefficients,
    rotation_vector_to_matrix,
    rotation_matrix_to_vector,
    euler_angles_from_rotation_matrix,
    project_3d_to_2d,
    solve_head_pose,
    calculate_head_pose_projection,
    CANONICAL_FACE_MODEL,
    
    # EAR calculations
    calculate_ear,
    calculate_ear_from_coords,
    
    # Bounding box utilities
    bounding_box_from_landmarks,
    box_iou,
    
    # Smoothing utilities
    ExponentialMovingAverage,
    MovingAverage,
    
    # Validation utilities
    is_point_in_image,
    clip_point_to_image,
    is_valid_rotation_matrix,
)

__all__ = [
    # Distance measurements
    'euclidean_distance',
    'euclidean_distance_2d',
    'euclidean_distance_3d',
    'point_to_line_distance',
    'midpoint',
    
    # Angle calculations
    'angle_between_vectors',
    'signed_angle_2d',
    'normalize_angle',
    'degrees_to_radians',
    'radians_to_degrees',
    
    # Coordinate transformations
    'normalize_to_image_coords',
    'image_to_normalized_coords',
    'landmarks_to_pixel_coords',
    
    # Head pose helpers
    'create_camera_matrix',
    'get_distortion_coefficients',
    'rotation_vector_to_matrix',
    'rotation_matrix_to_vector',
    'euler_angles_from_rotation_matrix',
    'project_3d_to_2d',
    'solve_head_pose',
    'calculate_head_pose_projection',
    'CANONICAL_FACE_MODEL',
    
    # EAR calculations
    'calculate_ear',
    'calculate_ear_from_coords',
    
    # Bounding box utilities
    'bounding_box_from_landmarks',
    'box_iou',
    
    # Smoothing utilities
    'ExponentialMovingAverage',
    'MovingAverage',
    
    # Validation utilities
    'is_point_in_image',
    'clip_point_to_image',
    'is_valid_rotation_matrix',
]

