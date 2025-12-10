import React, { useState, useEffect, useMemo } from 'react';
import './ViolationsTab.css';

interface User {
    userId: string;
    username: string;
    role: string;
    fullName: string;
}

interface Violation {
    violation_id: string;
    exam_id: string;
    exam_title: string;
    violation_type: string;
    application_name: string;
    start_time: string;
    end_time: string | null;
    duration: number;
    screenshot_path: string | null;
}

interface ViolationsTabProps {
    user: User;
}

const ViolationsTab: React.FC<ViolationsTabProps> = ({ user }) => {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedExam, setSelectedExam] = useState<string>('all');
    const [exams, setExams] = useState<{ exam_id: string; title: string }[]>([]);
    const [showDetailedLogs, setShowDetailedLogs] = useState(false);

    const isElectron = () => !!(window as any).electronAPI;

    useEffect(() => {
        loadViolations();
    }, [user.userId]);

    const loadViolations = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!isElectron()) {
                setViolations([]);
                setLoading(false);
                return;
            }

            const result = await (window as any).electronAPI.getStudentViolations(null);

            if (result.success) {
                setViolations(result.violations || []);

                // Extract unique exams
                const uniqueExams = Array.from(
                    new Map(
                        result.violations.map((v: Violation) => [v.exam_id, { exam_id: v.exam_id, title: v.exam_title }])
                    ).values()
                );
                setExams(uniqueExams as { exam_id: string; title: string }[]);
            } else {
                setError(result.error || 'Failed to load violations');
            }
        } catch (err) {
            console.error('Error loading violations:', err);
            setError('Failed to load violations');
        } finally {
            setLoading(false);
        }
    };

    const filteredViolations = useMemo(() => {
        return selectedExam === 'all'
            ? violations
            : violations.filter(v => v.exam_id === selectedExam);
    }, [violations, selectedExam]);

    // Calculate statistics
    const stats = useMemo(() => {
        const total = filteredViolations.length;

        const byExam = filteredViolations.reduce((acc, v) => {
            acc[v.exam_id] = (acc[v.exam_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalDuration = filteredViolations.reduce((sum, v) => sum + (v.duration || 0), 0);
        const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

        // Get exam names for chart
        const examData = Object.entries(byExam).map(([examId, count]) => {
            const exam = exams.find(e => e.exam_id === examId);
            return {
                examId,
                examName: exam?.title || 'Unknown Exam',
                count
            };
        }).sort((a, b) => b.count - a.count);

        return {
            total,
            byExam: examData,
            totalDuration,
            avgDuration
        };
    }, [filteredViolations, exams]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDateTime = (dateString: string): string => {
        return new Date(dateString).toLocaleString();
    };

    const getViolationIcon = (): string => {
        return '🚫';
    };

    const getViolationColor = (): string => {
        return 'red';
    };

    const getViolationTypeLabel = (type: string): string => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Calculate max count for chart scaling
    const maxCount = stats.byExam.length > 0 
        ? Math.max(...stats.byExam.map(e => e.count))
        : 1;

    if (loading) {
        return (
            <div className="violations-tab">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading violations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="violations-tab">
            <div className="violations-header">
                <h2>📋 My Violations</h2>
                <p>Review any violations detected during your exams</p>
            </div>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {filteredViolations.length === 0 ? (
                <div className="no-violations">
                    <div className="no-violations-icon">✅</div>
                    <h3>No Violations Found</h3>
                    <p>You have a clean record! Keep up the good work.</p>
                </div>
            ) : (
                <>
                    {/* Statistics Overview */}
                    <div className="violations-overview">
                        <div className="overview-cards">
                            <div className="overview-card">
                                <div className="card-icon">📊</div>
                                <div className="card-content">
                                    <div className="card-value">{stats.total}</div>
                                    <div className="card-label">Total Violations</div>
                                </div>
                            </div>
                            <div className="overview-card">
                                <div className="card-icon">⏱️</div>
                                <div className="card-content">
                                    <div className="card-value">{formatDuration(stats.avgDuration)}</div>
                                    <div className="card-label">Avg Duration</div>
                                </div>
                            </div>
                            <div className="overview-card">
                                <div className="card-icon">📱</div>
                                <div className="card-content">
                                    <div className="card-value">
                                        {new Set(filteredViolations.map(v => v.application_name)).size}
                                    </div>
                                    <div className="card-label">Unique Apps</div>
                                </div>
                            </div>
                            <div className="overview-card">
                                <div className="card-icon">📝</div>
                                <div className="card-content">
                                    <div className="card-value">{stats.byExam.length}</div>
                                    <div className="card-label">Exams Affected</div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        {stats.byExam.length > 0 && (
                            <div className="charts-section">
                                <div className="chart-container chart-container-full">
                                    <h3>📊 Violations by Exam</h3>
                                    <div className="chart-content">
                                        {stats.byExam.map(({ examId, examName, count }) => {
                                            const percentage = (count / maxCount) * 100;
                                            return (
                                                <div key={examId} className="chart-item">
                                                    <div className="chart-item-header">
                                                        <span className="chart-item-label" title={examName}>
                                                            {examName.length > 40 ? `${examName.substring(0, 40)}...` : examName}
                                                        </span>
                                                        <span className="chart-item-value">{count}</span>
                                                    </div>
                                                    <div className="chart-bar-container">
                                                        <div 
                                                            className="chart-bar blue"
                                                            style={{ width: `${percentage}%` }}
                                                        >
                                                            <span className="chart-bar-percentage">{count} violation{count !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filter and Toggle */}
                    <div className="violations-controls">
                        {exams.length > 0 && (
                            <div className="violations-filter">
                                <label>Filter by Exam:</label>
                                <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
                                    <option value="all">All Exams</option>
                                    {exams.map(exam => (
                                        <option key={exam.exam_id} value={exam.exam_id}>
                                            {exam.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <button 
                            className="toggle-logs-btn"
                            onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                        >
                            {showDetailedLogs ? '📋 Hide Detailed Logs' : '📋 View Detailed Logs'}
                        </button>
                    </div>

                    {/* Detailed Logs (Collapsible) */}
                    {showDetailedLogs && (
                        <div className="violations-list">
                            {filteredViolations.map((violation) => (
                                <div
                                    key={violation.violation_id}
                                    className={`violation-card ${getViolationColor()}`}
                                >
                                    <div className="violation-icon">
                                        {getViolationIcon()}
                                    </div>
                                    <div className="violation-details">
                                        <div className="violation-header-row">
                                            <h3>{violation.exam_title}</h3>
                                            <span className="violation-type">
                                                {getViolationTypeLabel(violation.violation_type)}
                                            </span>
                                        </div>
                                        <div className="violation-info">
                                            <p><strong>Application:</strong> {violation.application_name}</p>
                                            <p><strong>Time:</strong> {formatDateTime(violation.start_time)}</p>
                                            <p><strong>Duration:</strong> {formatDuration(violation.duration)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ViolationsTab;
