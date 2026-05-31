import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Timer from '../components/Timer';
import Stopwatch from '../components/Stopwatch';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, SkipForward, Square, CheckSquare, Flag, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const WorkoutSession = () => {
    const navigate = useNavigate();
    const [routine, setRoutine] = useState(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completedSets, setCompletedSets] = useState({}); // Map of exerciseIndex-setIndex -> boolean
    const [phase, setPhase] = useState('WORK'); // 'WORK' or 'REST'
    const [timeLeft, setTimeLeft] = useState(30);
    const [isPaused, setIsPaused] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchRoutine();
    }, []);

    useEffect(() => {
        let interval = null;
        if (!loading && routine && !isPaused && hasStarted) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev > 1) return prev - 1;

                    // Timer hit 0, handle transition
                    handlePhaseTransition();
                    return 0; // Will be reset in handlePhaseTransition
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loading, routine, isPaused, phase, currentExerciseIndex, hasStarted]);

    const handlePhaseTransition = () => {
        if (!routine) return; // Ensure routine is loaded

        if (phase === 'WORK') {
            // Switch to Rest
            setPhase('REST');
            setTimeLeft(10); // 10 seconds rest
        } else {
            // Switch to Work (Next Exercise)
            if (currentExerciseIndex < routine.exercises.length - 1) {
                setCurrentExerciseIndex((prev) => prev + 1);
                setPhase('WORK');
                setTimeLeft(30); // 30 seconds work
            } else {
                // Workout Finished
                setIsPaused(true);
                handleFinishWorkout();
            }
        }
    };

    const handleSkip = () => {
        handlePhaseTransition();
    };

    const handleTogglePause = () => {
        setIsPaused(!isPaused);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const fetchRoutine = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;

            // 1. Fetch Default Routine First
            let currentRoutine = null;
            const res = await axios.get('http://localhost:5000/api/v1/workouts/routines/generate', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.length > 0) {
                const routineId = res.data[0]._id;
                const fullRoutineRes = await axios.get(`http://localhost:5000/api/v1/workouts/routines/${routineId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                currentRoutine = fullRoutineRes.data;
            }

            // 2. Check & Merge Custom Queue
            const customQueue = JSON.parse(localStorage.getItem('activeWorkoutQueue') || '[]');

            if (customQueue.length > 0) {
                const formattedCustomExercises = customQueue.map(ex => ({
                    exercise: ex,
                    sets: 3,
                    reps: '12',
                    _id: `custom-${Date.now()}-${Math.random()}`
                }));

                if (currentRoutine) {
                    currentRoutine.exercises = [...currentRoutine.exercises, ...formattedCustomExercises];
                } else {
                    currentRoutine = {
                        _id: 'custom-combined',
                        name: 'Custom Session',
                        exercises: formattedCustomExercises
                    };
                }

                // Keep queue until finished
            }

            setRoutine(currentRoutine);
        } catch (err) {
            console.error(err);
            alert("Failed to load workout.");
        } finally {
            setLoading(false);
        }
    };

    const handleSetToggle = (exerciseIndex, setIndex) => {
        const key = `${exerciseIndex}-${setIndex}`;
        setCompletedSets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleRemoveExercise = (index) => {
        if (routine.exercises.length <= 1) {
            alert("You cannot remove the last exercise!");
            return;
        }
        const updatedExercises = routine.exercises.filter((_, i) => i !== index);
        setRoutine({ ...routine, exercises: updatedExercises });

        // Adjust current index if needed
        if (currentExerciseIndex >= updatedExercises.length) {
            setCurrentExerciseIndex(updatedExercises.length - 1);
        } else if (currentExerciseIndex > index) {
            setCurrentExerciseIndex(prev => prev - 1);
        }
    };

    const handleMoveExercise = (index, direction) => {
        const newExercises = [...routine.exercises];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newExercises.length) return;

        // Swap
        [newExercises[index], newExercises[targetIndex]] = [newExercises[targetIndex], newExercises[index]];

        setRoutine({ ...routine, exercises: newExercises });

        // Update current index to follow the exercise if it was the active one
        if (currentExerciseIndex === index) {
            setCurrentExerciseIndex(targetIndex);
        } else if (currentExerciseIndex === targetIndex) {
            setCurrentExerciseIndex(index);
        }
    };

    const handleFinishWorkout = async () => {
        if (!routine) return;
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;

            // Construct payload
            const exercisesCompleted = routine.exercises.map((ex, idx) => ({
                exercise: ex.exercise._id,
                sets: Array(ex.sets).fill(0).map((_, setIdx) => ({
                    reps: parseInt(ex.reps) || 0, // Simplified
                    weight: 0, // Should be from input
                    completed: !!completedSets[`${idx}-${setIdx}`]
                }))
            }));

            await axios.post('http://localhost:5000/api/v1/workouts/sessions', {
                routineId: routine._id,
                duration: 45, // Should be calculated from start/end time
                caloriesBurned: 300, // Dummy value
                exercisesCompleted,
                notes: "Great workout!"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Clear custom queue now that it is saved
            localStorage.removeItem('activeWorkoutQueue');

            alert('Workout Saved!');
            navigate('/workouts/dashboard');
        } catch (err) {
            console.error(err);
            alert('Error saving workout');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        </div>
    );

    if (!routine) return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="bg-card backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center max-w-md border border-border">
                <div className="text-6xl mb-6 animate-bounce">🔍</div>
                <h2 className="text-3xl font-black mb-4 text-foreground tracking-tight">No Routine Found</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">We couldn't generate a routine for you. Please update your profile to help us create the perfect plan.</p>
                <button
                    onClick={() => navigate('/workouts/profile')}
                    className="bg-primary text-black px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition duration-300 shadow-[0_0_20px_rgba(204,255,0,0.3)] w-full"
                >
                    Setup Profile
                </button>
            </div>
        </div>
    );

    const currentExercise = routine.exercises[currentExerciseIndex];
    const progress = ((currentExerciseIndex + 1) / routine.exercises.length) * 100;

    return (
        <div className="min-h-screen pb-24">
            {/* Header / Progress Bar */}
            <div className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{routine.name}</h1>
                        <p className="text-sm text-muted-foreground">Exercise {currentExerciseIndex + 1} of {routine.exercises.length}</p>
                    </div>
                    <button
                        onClick={handleFinishWorkout}
                        className="bg-primary text-black px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition duration-300 shadow-lg shadow-primary/20 text-sm flex items-center gap-2"
                    >
                        <Flag className="w-4 h-4 ml-1" /> Finish
                    </button>
                </div>
                <div className="h-1 bg-muted w-full">
                    <div className="h-1 bg-primary transition-all duration-500 shadow-[0_0_10px_var(--primary)]" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Exercise Card & Timer */}
                        <div className={`bg-card backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-border transition-all duration-500 ${phase === 'REST' ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'border-primary/20'}`}>

                            {/* Central Timer Display */}
                            <div className="relative py-12 flex flex-col items-center justify-center bg-muted/30 text-center">
                                {!hasStarted ? (
                                    <button
                                        onClick={() => setHasStarted(true)}
                                        className="group relative inline-flex items-center justify-center px-10 py-6 overflow-hidden font-bold text-foreground transition-all duration-300 bg-primary/20 rounded-full hover:bg-primary/30 focus:outline-none ring-offset-2 focus:ring-2 ring-primary shadow-[0_0_30px_rgba(204,255,0,0.3)]"
                                    >
                                        <span className="absolute inset-0 border-0 group-hover:border-[4px] border-primary ease-linear duration-100 transition-all rounded-full"></span>
                                        <div className="flex items-center gap-3">
                                            <Play className="w-8 h-8 fill-current" />
                                            <span className="text-3xl font-black text-primary uppercase tracking-widest group-hover:text-foreground transition-colors">Start</span>
                                        </div>
                                    </button>
                                ) : (
                                    <>
                                        <div className={`text-8xl font-black font-mono tracking-widest mb-2 ${phase === 'REST' ? 'text-orange-500' : 'text-primary'}`}>
                                            {formatTime(timeLeft)}
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-widest ${phase === 'REST'
                                            ? 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                                            : 'bg-primary/20 text-primary border-primary/30'
                                            }`}>
                                            {phase === 'REST' ? 'Rest Time' : 'Active Interval'}
                                        </div>

                                        {/* Controls */}
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button
                                                onClick={handleTogglePause}
                                                className="p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all backdrop-blur-md"
                                                title={isPaused ? "Resume" : "Pause"}
                                            >
                                                {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                                            </button>
                                            <button
                                                onClick={handleSkip}
                                                className="p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all backdrop-blur-md font-bold text-xs"
                                                title="Skip"
                                            >
                                                <SkipForward className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-3xl font-black text-foreground tracking-tight">{currentExercise.exercise.name}</h2>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-primary">{currentExercise.sets}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Sets</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-muted/50 border-l-4 border-secondary mb-8">
                                    <p className="text-muted-foreground leading-relaxed italic">
                                        "{currentExercise.exercise.instructions[0]}"
                                    </p>
                                </div>

                                {/* Sets Tracker */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><span className="text-primary">#</span> Track Sets</h3>
                                    {Array.from({ length: currentExercise.sets }).map((_, idx) => {
                                        const isCompleted = !!completedSets[`${currentExerciseIndex}-${idx}`];
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleSetToggle(currentExerciseIndex, idx)}
                                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border ${isCompleted
                                                    ? 'bg-primary/20 border-primary'
                                                    : 'border-border bg-muted/50 hover:bg-muted'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isCompleted ? 'bg-primary text-black' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className={`font-medium ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                                                        {currentExercise.reps} Reps
                                                    </span>
                                                </div>
                                                <div className={`transition-all duration-300 ${isCompleted ? 'scale-110 text-primary' : 'scale-100 text-muted-foreground'}`}>
                                                    {isCompleted ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Navigation - Manual Overrides */}
                        <div className="flex justify-between gap-4">
                            <button
                                disabled={currentExerciseIndex === 0}
                                onClick={() => {
                                    setCurrentExerciseIndex(prev => prev - 1);
                                    setPhase('WORK');
                                    setTimeLeft(30);
                                }}
                                className="flex-1 py-4 bg-muted text-foreground border border-border rounded-xl font-bold hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                ← Previous
                            </button>
                            {currentExerciseIndex === routine.exercises.length - 1 ? (
                                <button
                                    onClick={handleFinishWorkout}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                >
                                    Stop <Square className="w-5 h-5 fill-current" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setCurrentExerciseIndex(prev => prev + 1);
                                        setPhase('WORK');
                                        setTimeLeft(30);
                                    }}
                                    className="flex-1 py-4 bg-primary text-black rounded-xl font-bold shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                >
                                    Next Exercise <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-card backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-border">
                            <h4 className="font-bold text-foreground mb-4 uppercase tracking-wide text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" /> Up Next
                            </h4>
                            {/* Simple Next Exercise Preview */}
                            {routine.exercises[currentExerciseIndex + 1] ? (
                                <div className="p-4 bg-muted rounded-xl border border-border">
                                    <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Coming Up</p>
                                    <p className="text-foreground font-bold text-lg">{routine.exercises[currentExerciseIndex + 1].exercise.name}</p>
                                    <p className="text-primary text-sm">{routine.exercises[currentExerciseIndex + 1].sets} sets × {routine.exercises[currentExerciseIndex + 1].reps}</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center gap-3">
                                    <Flag className="w-6 h-6 text-green-500" />
                                    <p className="text-green-400 font-bold">Almost Done!</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-card backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-border">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-foreground uppercase tracking-wide text-sm">Workout Plan</h4>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${isEditing
                                        ? 'bg-primary text-black border-primary'
                                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                        }`}
                                >
                                    {isEditing ? 'Done' : 'Edit'}
                                </button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {routine.exercises.map((ex, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => !isEditing && setCurrentExerciseIndex(idx)}
                                        className={`p-3 rounded-lg transition-colors flex items-center gap-3 ${idx === currentExerciseIndex && !isEditing
                                            ? 'bg-primary/20 border border-primary/50'
                                            : isEditing ? 'bg-muted border border-muted' : 'hover:bg-muted border border-transparent cursor-pointer'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx === currentExerciseIndex ? 'bg-primary text-black' : 'bg-muted/50 text-muted-foreground'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${idx === currentExerciseIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {ex.exercise.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{ex.sets} sets × {ex.reps}</p>
                                        </div>

                                        {isEditing && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMoveExercise(idx, 'up'); }}
                                                    disabled={idx === 0}
                                                    className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                                                >
                                                    <ChevronLeft className="w-4 h-4 rotate-90" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMoveExercise(idx, 'down'); }}
                                                    disabled={idx === routine.exercises.length - 1}
                                                    className="p-1 hover:bg-white/10 rounded text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
                                                >
                                                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveExercise(idx); }}
                                                    className="p-1 hover:bg-red-500/20 rounded text-red-500 ml-1"
                                                >
                                                    <Square className="w-4 h-4 fill-current" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default WorkoutSession;
