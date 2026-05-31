import { useEffect, useState } from 'react';
import scanService from '../services/scanService';
import axios from 'axios';

const History = () => {
    const [activeTab, setActiveTab] = useState('scans'); // 'scans', 'diet', 'workouts'
    const [scanHistory, setScanHistory] = useState([]);
    const [dietHistory, setDietHistory] = useState([]);
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const token = user ? user.token : null;
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [scansRes, dietRes, workoutsRes] = await Promise.all([
                    scanService.getHistory(),
                    axios.get('/api/diet/history', config).catch(() => ({ data: [] })),
                    axios.get('/api/v1/workouts/sessions', config).catch(() => ({ data: [] }))
                ]);

                setScanHistory(scansRes);
                setDietHistory(dietRes.data);
                setWorkoutHistory(workoutsRes.data);
            } catch (err) {
                setError('Failed to load history');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-center py-10">Loading history...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen p-4 pb-24">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-black text-foreground mb-8 text-center tracking-tight">My History</h1>

                <div className="flex justify-center mb-10">
                    <div className="bg-muted p-1 rounded-xl border border-border flex flex-wrap gap-1 justify-center backdrop-blur-md">
                        <button
                            className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 ${activeTab === 'scans' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                            onClick={() => setActiveTab('scans')}
                        >
                            Food Scans
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 ${activeTab === 'diet' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                            onClick={() => setActiveTab('diet')}
                        >
                            Diet Plans
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 ${activeTab === 'workouts' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                            onClick={() => setActiveTab('workouts')}
                        >
                            Workouts
                        </button>
                    </div>
                </div>

                {activeTab === 'scans' && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {scanHistory.length === 0 ? <p className="text-center col-span-full text-muted-foreground font-medium">No scans yet.</p> : scanHistory.map((scan) => (
                            <div key={scan._id} className="bg-card backdrop-blur-md border border-border rounded-2xl p-6 hover:border-primary/50 transition duration-300 group">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs text-muted-foreground font-mono">{new Date(scan.createdAt).toLocaleDateString()}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full text-black ${scan.healthScore === null ? 'bg-gray-400' :
                                        scan.healthScore >= 70 ? 'bg-green-400' : scan.healthScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                                        }`}>
                                        Score: {scan.healthScore !== null ? scan.healthScore : 'N/A'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2 truncate group-hover:text-primary transition-colors" title={scan.productName}>
                                    {scan.productName}
                                </h3>

                                {scan.imageUrl && (
                                    <div className="h-40 bg-muted rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-border">
                                        <img src={scan.imageUrl} alt={scan.productName} className="object-contain h-full w-full" />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <div className="bg-muted p-2 rounded-lg text-center"><span className="block text-primary font-bold">{scan.calories}</span> Cal</div>
                                    <div className="bg-muted p-2 rounded-lg text-center"><span className="block text-secondary font-bold">{scan.protein}g</span> Protein</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'diet' && (
                    <div className="space-y-4">
                        {dietHistory.length === 0 ? <p className="text-center text-muted-foreground font-medium">No saved diet plans yet.</p> : dietHistory.map((log) => (
                            <div key={log._id} className="bg-card backdrop-blur-md border border-border rounded-2xl p-6 border-l-4 border-l-secondary flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-muted transition-colors">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1 font-mono">{new Date(log.date).toLocaleDateString()} at {new Date(log.date).toLocaleTimeString()}</p>
                                    <h3 className="text-xl font-bold text-foreground">Diet Plan Snapshot</h3>
                                    <p className="text-muted-foreground mt-1">Target: <span className="font-bold text-secondary">{log.calories} kcal</span></p>
                                </div>
                                <div className="text-right text-sm space-y-1 bg-muted p-4 rounded-xl border border-border min-w-[200px]">
                                    <p className="flex justify-between text-muted-foreground"><span>🥩 Protein</span> <span className="font-bold text-primary">{log.macros.protein.grams}g</span></p>
                                    <p className="flex justify-between text-muted-foreground"><span>🍞 Carbs</span> <span className="font-bold text-foreground">{log.macros.carbs.grams}g</span></p>
                                    <p className="flex justify-between text-muted-foreground"><span>🥑 Fats</span> <span className="font-bold text-foreground">{log.macros.fats.grams}g</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'workouts' && (
                    <div className="space-y-4">
                        {workoutHistory.length === 0 ? <p className="text-center text-muted-foreground font-medium">No workout sessions logged yet.</p> : workoutHistory.map((session) => (
                            <div key={session._id} className="bg-card backdrop-blur-md border border-border rounded-2xl p-6 border-l-4 border-l-accent hover:bg-muted transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 font-mono">{new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString()}</p>
                                        <h3 className="text-xl font-bold text-foreground">{session.routineId?.name || 'Custom Workout'}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-accent/20 text-accent border border-accent/20 text-xs font-bold px-3 py-1 rounded-full">
                                            {session.duration} mins
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                                    <div className="bg-muted p-3 rounded-xl border border-border">
                                        <span className="block text-xs text-muted-foreground uppercase tracking-widest mb-1">Calories Burned</span>
                                        <span className="font-bold text-foreground text-lg">{session.caloriesBurned} <span className="text-xs font-normal text-muted-foreground">kcal</span></span>
                                    </div>
                                    <div className="bg-muted p-3 rounded-xl border border-border">
                                        <span className="block text-xs text-muted-foreground uppercase tracking-widest mb-1">Exercises</span>
                                        <span className="font-bold text-foreground text-lg">{session.exercisesCompleted?.length || 0}</span>
                                    </div>
                                </div>

                                {session.notes && (
                                    <div className="text-sm text-muted-foreground italic border-t border-border pt-3">
                                        "{session.notes}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
