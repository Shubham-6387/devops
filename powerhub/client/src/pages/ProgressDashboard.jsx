import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ProgressDashboard = () => {
    const [sessions, setSessions] = useState([]);
    const [logs, setLogs] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            if (!token) return;

            const [sessionsRes, logsRes, exercisesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/v1/workouts/sessions', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/v1/workouts/progress', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/v1/workouts/exercises', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setSessions(sessionsRes.data);
            setLogs(logsRes.data);
            setExercises(exercisesRes.data);

            if (logsRes.data.length > 0) {
                setSelectedExercise(logsRes.data[0].exerciseId);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Common Chart Options
    const commonOptions = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: '#e5e7eb',
                    font: { family: "'Inter', sans-serif", weight: 'bold' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#e5e7eb',
                padding: 12,
                cornerRadius: 8,
                titleFont: { family: "'Inter', sans-serif", weight: 'bold' },
                displayColors: true,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
            }
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af', font: { family: "'Inter', sans-serif" } },
                grid: { display: false }
            },
            y: {
                ticks: { color: '#9ca3af', font: { family: "'Inter', sans-serif" } },
                grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [5, 5] },
                border: { display: false }
            }
        },
        elements: {
            line: { tension: 0.4 },
            point: {
                radius: 4,
                hoverRadius: 8,
                borderWidth: 2,
            }
        }
    };

    // 1. Workout Frequency
    const processFrequencyData = () => {
        const weeks = {};
        sessions.forEach(session => {
            const date = new Date(session.date);
            const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
            const weekLabel = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            weeks[weekLabel] = (weeks[weekLabel] || 0) + 1;
        });

        const sortedLabels = Object.keys(weeks).sort((a, b) => new Date(a) - new Date(b));

        return {
            labels: sortedLabels,
            datasets: [
                {
                    label: 'Workouts',
                    data: sortedLabels.map(label => weeks[label]),
                    borderColor: '#CCFF00',
                    pointBackgroundColor: '#000',
                    pointBorderColor: '#CCFF00',
                    fill: true,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(204, 255, 0, 0.4)');
                        gradient.addColorStop(1, 'rgba(204, 255, 0, 0.0)');
                        return gradient;
                    },
                },
            ],
        };
    };

    // 2. Strength Progress
    const processStrengthData = () => {
        if (!selectedExercise) return { labels: [], datasets: [] };

        const exerciseLogs = logs
            .filter(log => log.exerciseId === selectedExercise)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            labels: exerciseLogs.map(log => new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
            datasets: [
                {
                    label: 'Max Weight (kg)',
                    data: exerciseLogs.map(log => log.maxWeight),
                    borderColor: '#00F0FF',
                    pointBackgroundColor: '#000',
                    pointBorderColor: '#00F0FF',
                    fill: true,
                    yAxisID: 'y',
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
                        gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
                        return gradient;
                    },
                },
                {
                    label: 'Volume (kg)',
                    data: exerciseLogs.map(log => log.totalVolume),
                    borderColor: '#7000FF',
                    pointBackgroundColor: '#000',
                    pointBorderColor: '#7000FF',
                    fill: true,
                    yAxisID: 'y1',
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(112, 0, 255, 0.3)');
                        gradient.addColorStop(1, 'rgba(112, 0, 255, 0.0)');
                        return gradient;
                    },
                }
            ],
        };
    };

    const caloriesData = {
        labels: sessions.slice().reverse().map(s => new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'Calories Burned',
                data: sessions.slice().reverse().map(s => s.caloriesBurned),
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, '#FF0055');
                    gradient.addColorStop(1, 'rgba(255, 0, 85, 0.3)');
                    return gradient;
                },
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
        </div>
    );

    const loggedExerciseIds = [...new Set(logs.map(log => log.exerciseId))];
    const loggedExercises = exercises.filter(ex => loggedExerciseIds.includes(ex._id));

    return (
        <div className="container mx-auto p-6 space-y-8 pb-32">
            <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-foreground tracking-tighter">Your <span className="text-primary">Progress</span></h2>
                <div className="px-4 py-2 bg-muted rounded-full border border-border text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Last 30 Days
                </div>
            </div>

            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card p-8 rounded-[2rem] border border-border shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
                    <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        Workout Frequency
                    </h3>
                    <div className="h-64">
                        <Line options={commonOptions} data={processFrequencyData()} />
                    </div>
                </div>
                <div className="bg-card p-8 rounded-[2rem] border border-border shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full group-hover:bg-red-500/20 transition-all duration-700"></div>
                    <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Calories Burned
                    </h3>
                    <div className="h-64">
                        <Bar options={commonOptions} data={caloriesData} />
                    </div>
                </div>
            </div>

            {/* Middle Row: Strength */}
            <div className="bg-card p-8 rounded-[2rem] border border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-foreground tracking-tight">Strength Analysis</h3>
                        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-lg border border-cyan-500/20">Advanced Metrics</span>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            className="appearance-none pl-6 pr-12 py-3 bg-muted border border-border rounded-xl text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer hover:bg-muted/80"
                        >
                            {loggedExercises.map(ex => (
                                <option key={ex._id} value={ex._id} className="bg-background">{ex.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            ▼
                        </div>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <Line
                        options={{
                            ...commonOptions,
                            maintainAspectRatio: false,
                            interaction: { mode: 'index', intersect: false },
                            scales: {
                                ...commonOptions.scales,
                                y: { ...commonOptions.scales.y, display: true, title: { display: true, text: 'Max Weight (kg)', color: '#00F0FF' } },
                                y1: { ...commonOptions.scales.y, display: true, position: 'right', grid: { display: false }, title: { display: true, text: 'Volume (kg)', color: '#7000FF' } },
                            }
                        }}
                        data={processStrengthData()}
                    />
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
                    <button className="text-primary text-sm font-bold hover:underline">View All History →</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="py-5 px-8 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="py-5 px-8 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Routine</th>
                                <th className="py-5 px-8 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Duration</th>
                                <th className="py-5 px-8 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Burn</th>
                                <th className="py-5 px-8 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Load</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sessions.map(session => (
                                <tr key={session._id} className="hover:bg-muted/50 transition-colors group">
                                    <td className="py-5 px-8 text-muted-foreground font-medium">{new Date(session.date).toLocaleDateString()}</td>
                                    <td className="py-5 px-8">
                                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{session.routineId?.name || 'Custom Workout'}</span>
                                    </td>
                                    <td className="py-5 px-8 text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500/50"></span>
                                            {session.duration} min
                                        </div>
                                    </td>
                                    <td className="py-5 px-8 text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
                                            {session.caloriesBurned} kcal
                                        </div>
                                    </td>
                                    <td className="py-5 px-8">
                                        <span className="px-3 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground border border-border">
                                            {session.exercisesCompleted.length} Ex
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProgressDashboard;
