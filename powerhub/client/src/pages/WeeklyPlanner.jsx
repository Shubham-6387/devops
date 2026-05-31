import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeeklyPlanner = () => {
    const [plan, setPlan] = useState(null);
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;
            const [planRes, routinesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/v1/workouts/weekly-plan', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/v1/workouts/routines', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setPlan(planRes.data || { days: daysOfWeek.map(day => ({ dayOfWeek: day, routineId: '', isRestDay: false })) });
            setRoutines(routinesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDayChange = (index, field, value) => {
        const newDays = [...plan.days];
        newDays[index] = { ...newDays[index], [field]: value };
        setPlan({ ...plan, days: newDays });
    };

    const savePlan = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;

            // Sanitize days: Ensure routineId is just an ID string, not an object
            const sanitizedDays = plan.days.map(day => {
                let rId = day.routineId;
                if (rId && typeof rId === 'object') {
                    rId = rId._id;
                }
                if (rId === '') {
                    rId = null;
                }
                return {
                    ...day,
                    routineId: rId
                };
            });

            // Normalize Date to start of the week (Monday)
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(today.setDate(diff));
            monday.setHours(0, 0, 0, 0);

            await axios.post('http://localhost:5000/api/v1/workouts/weekly-plan', {
                weekStartDate: monday,
                days: sanitizedDays
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Plan Saved!');
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Error saving plan';
            alert(message);
        }
    };

    if (loading) return <div className="p-6">Loading planner...</div>;

    return (
        <div className="container mx-auto p-6 pb-24">
            <h2 className="text-4xl font-black mb-8 text-foreground tracking-tight">Weekly Workout Planner</h2>

            <div className="bg-card backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th className="py-4 px-6 text-left font-bold text-muted-foreground uppercase tracking-wider text-sm">Day</th>
                                <th className="py-4 px-6 text-left font-bold text-muted-foreground uppercase tracking-wider text-sm">Activity / Routine</th>
                                <th className="py-4 px-6 text-center font-bold text-muted-foreground uppercase tracking-wider text-sm">Rest Day</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {plan.days.map((day, index) => (
                                <tr key={day.dayOfWeek} className={`transition-colors hover:bg-muted ${day.isRestDay ? 'bg-muted' : ''}`}>
                                    <td className="py-4 px-6 font-bold text-foreground">{day.dayOfWeek}</td>
                                    <td className="py-4 px-6">
                                        <select
                                            disabled={day.isRestDay}
                                            value={day.routineId?._id || day.routineId || ''}
                                            onChange={(e) => handleDayChange(index, 'routineId', e.target.value)}
                                            className="w-full p-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all [&>option]:bg-background"
                                        >
                                            <option value="">Select Routine</option>
                                            {routines.map(r => (
                                                <option key={r._id} value={r._id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <input
                                            type="checkbox"
                                            checked={day.isRestDay}
                                            onChange={(e) => handleDayChange(index, 'isRestDay', e.target.checked)}
                                            className="w-6 h-6 rounded border-border text-primary focus:ring-primary bg-muted"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={savePlan}
                    className="px-8 py-4 bg-primary text-black font-bold text-lg rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-[0_0_20px_rgba(204,255,0,0.3)] transform hover:scale-105"
                >
                    Save Weekly Plan
                </button>
            </div>
        </div>
    );
};

export default WeeklyPlanner;
