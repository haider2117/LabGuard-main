import React, { useState, useEffect } from 'react';
import './CourseManagement.css';

interface Course {
    course_id: string;
    course_name: string;
    course_code: string;
    teacher_id: string;
    teacher_name?: string;
    description: string;
    student_count: number;
}

interface Student {
    user_id: string;
    username: string;
    full_name: string;
    email: string;
}

interface Teacher {
    user_id: string;
    username: string;
    full_name: string;
    email: string;
}

const AdminCourseManagement: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        courseName: '',
        courseCode: '',
        description: '',
        teacherId: ''
    });

    useEffect(() => {
        loadCourses();
        loadAllStudents();
        loadAllTeachers();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const result = await (window as any).electronAPI.getAllCourses();
            if (result.success) {
                setCourses(result.courses || []);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAllStudents = async () => {
        try {
            const result = await (window as any).electronAPI.getUsers({ role: 'student' });
            if (result.success) {
                setAllStudents(result.users || []);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadAllTeachers = async () => {
        try {
            const result = await (window as any).electronAPI.getUsers({ role: 'teacher' });
            if (result.success) {
                setAllTeachers(result.users || []);
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    };

    const loadEnrolledStudents = async (courseId: string) => {
        try {
            const result = await (window as any).electronAPI.getEnrolledStudents(courseId);
            if (result.success) {
                setEnrolledStudents(result.students || []);
            }
        } catch (error) {
            console.error('Error loading enrolled students:', error);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.teacherId) {
            alert('Please select a teacher for this course');
            return;
        }

        const result = await (window as any).electronAPI.createCourse({
            courseName: formData.courseName,
            courseCode: formData.courseCode,
            description: formData.description,
            teacherId: formData.teacherId
        });

        if (result.success) {
            alert('Course created successfully!');
            setFormData({ courseName: '', courseCode: '', description: '', teacherId: '' });
            setShowCreateForm(false);
            loadCourses();
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleViewCourse = async (course: Course) => {
        setSelectedCourse(course);
        await loadEnrolledStudents(course.course_id);
    };

    const handleEnrollStudent = async (studentId: string) => {
        if (!selectedCourse) return;

        const result = await (window as any).electronAPI.enrollStudent(selectedCourse.course_id, studentId);

        if (result.success) {
            alert('Student enrolled successfully!');
            await loadEnrolledStudents(selectedCourse.course_id);
            await loadCourses();
            setShowEnrollModal(false);
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleUnenrollStudent = async (studentId: string) => {
        if (!selectedCourse) return;

        if (window.confirm('Are you sure you want to unenroll this student?')) {
            const result = await (window as any).electronAPI.unenrollStudent(selectedCourse.course_id, studentId);

            if (result.success) {
                alert('Student unenrolled successfully!');
                await loadEnrolledStudents(selectedCourse.course_id);
                await loadCourses();
            } else {
                alert('Error: ' + result.error);
            }
        }
    };

    const getAvailableStudents = () => {
        const enrolledIds = enrolledStudents.map(s => s.user_id);
        return allStudents.filter(s => !enrolledIds.includes(s.user_id));
    };

    return (
        <div className="course-management">
            <div className="course-header">
                <h2>Course Management</h2>
                <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
                    Create New Course
                </button>
            </div>

            {showCreateForm && (
                <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Create New Course</h3>
                        <form onSubmit={handleCreateCourse}>
                            <div className="form-group">
                                <label>Course Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Introduction to Computer Science"
                                    value={formData.courseName}
                                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Course Code *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., CS101"
                                    value={formData.courseCode}
                                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Teacher *</label>
                                <select
                                    value={formData.teacherId}
                                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a teacher</option>
                                    {allTeachers.map(teacher => (
                                        <option key={teacher.user_id} value={teacher.user_id}>
                                            {teacher.full_name} ({teacher.username})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    placeholder="Course description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-primary">Create Course</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedCourse && (
                <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
                    <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                        <h3>{selectedCourse.course_name}</h3>
                        <p className="course-code">{selectedCourse.course_code}</p>
                        {selectedCourse.teacher_name && (
                            <p className="teacher-name">Teacher: {selectedCourse.teacher_name}</p>
                        )}
                        <p className="course-description">{selectedCourse.description}</p>

                        <div className="enrolled-students-section">
                            <div className="section-header">
                                <h4>Enrolled Students ({enrolledStudents.length})</h4>
                                <button className="btn-primary" onClick={() => setShowEnrollModal(true)}>
                                    Enroll Student
                                </button>
                            </div>

                            <div className="students-list">
                                {enrolledStudents.length === 0 ? (
                                    <p className="no-data">No students enrolled yet</p>
                                ) : (
                                    enrolledStudents.map(student => (
                                        <div key={student.user_id} className="student-item">
                                            <div className="student-info">
                                                <strong>{student.full_name}</strong>
                                                <span className="student-username">{student.username}</span>
                                            </div>
                                            <button
                                                className="btn-danger-small"
                                                onClick={() => handleUnenrollStudent(student.user_id)}
                                            >
                                                Unenroll
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {showEnrollModal && (
                            <div className="enroll-modal">
                                <h4>Select Student to Enroll</h4>
                                <div className="students-list">
                                    {getAvailableStudents().length === 0 ? (
                                        <p className="no-data">All students are already enrolled</p>
                                    ) : (
                                        getAvailableStudents().map(student => (
                                            <div key={student.user_id} className="student-item">
                                                <div className="student-info">
                                                    <strong>{student.full_name}</strong>
                                                    <span className="student-username">{student.username}</span>
                                                </div>
                                                <button
                                                    className="btn-primary-small"
                                                    onClick={() => handleEnrollStudent(student.user_id)}
                                                >
                                                    Enroll
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button className="btn-secondary" onClick={() => setShowEnrollModal(false)}>
                                    Close
                                </button>
                            </div>
                        )}

                        <button className="btn-secondary" onClick={() => setSelectedCourse(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading">Loading courses...</div>
            ) : (
                <div className="courses-grid">
                    {courses.length === 0 ? (
                        <div className="no-courses">
                            <p>No courses yet. Create your first course to get started!</p>
                        </div>
                    ) : (
                        courses.map(course => (
                            <div key={course.course_id} className="course-card" onClick={() => handleViewCourse(course)}>
                                <h3>{course.course_name}</h3>
                                <p className="course-code">{course.course_code}</p>
                                {course.teacher_name && (
                                    <p className="teacher-name">Teacher: {course.teacher_name}</p>
                                )}
                                <p className="course-description">{course.description}</p>
                                <div className="course-footer">
                                    <span className="student-count">
                                        👥 {course.student_count || 0} student{(course.student_count || 0) !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminCourseManagement;

