import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WorkoutProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        age: '',
        gender: 'male',
        fitnessGoal: 'general_fitness',
        experienceLevel: 'beginner',
        equipment: 'none',
        dailyDuration: 30,
        weight: '', // kg
        height: '' // cm
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;
            const res = await axios.get('http://localhost:5000/api/v1/workouts/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setFormData(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;
            await axios.post('http://localhost:5000/api/v1/workouts/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/workouts');
        } catch (err) {
            console.error(err);
            alert('Error saving profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 mt-10">
            <div className="bg-card backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
                <h2 className="text-3xl font-black mb-8 text-center text-foreground tracking-tight">Setup Your Workout Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-muted-foreground font-medium mb-2 text-sm uppercase tracking-wider">Age</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="w-full p-4 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-muted-foreground font-medium mb-2 text-sm uppercase tracking-wider">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full p-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all [&>option]:bg-background"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-muted-foreground font-medium mb-2 text-sm uppercase tracking-wider">Fitness Goal</label>
                        <select
                            name="fitnessGoal"
                            value={formData.fitnessGoal}
                            onChange={handleChange}
                            className="w-full p-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all [&>option]:bg-background"
                        >
                            <option value="weight_loss">Weight Loss</option>
                            <option value="weight_gain">Weight Gain</option>
                            <option value="strength">Strength Building</option>
                            <option value="general_fitness">General Fitness</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-muted-foreground font-medium mb-2 text-sm uppercase tracking-wider">Experience Level</label>
                        <select
                            name="experienceLevel"
                            value={formData.experienceLevel}
                            onChange={handleChange}
                            className="w-full p-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all [&>option]:bg-background"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-muted-foreground font-medium mb-2 text-sm uppercase tracking-wider">Available Equipment</label>
                        <select
                            name="equipment"
                            value={formData.equipment}
                            onChange={handleChange}
                            className="w-full p-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all [&>option]:bg-background"
                        >
                            <option value="none">None (Bodyweight)</option>
                            <option value="dumbbells">Dumbbells</option>
                            <option value="resistance_bands">Resistance Bands</option>
                            <option value="gym">Full Gym</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-muted-foreground font-medium mb-2 text-sm uppercase tracking-wider">Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                className="w-full p-4 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="e.g., 70"
                            />
                        </div>

                        <div>
                            <label className="block text-muted-foreground font-medium mb-2 text-sm uppercase tracking-wider">Height (cm)</label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                className="w-full p-4 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="e.g., 170"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-muted-foreground font-medium mb-2 text-sm uppercase tracking-wider">Daily Workout Duration (minutes)</label>
                        <input
                            type="number"
                            name="dailyDuration"
                            value={formData.dailyDuration}
                            onChange={handleChange}
                            className="w-full p-4 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-6 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all duration-300 shadow-[0_0_20px_rgba(0,127,255,0.3)] transform hover:scale-[1.02]"
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WorkoutProfile;
