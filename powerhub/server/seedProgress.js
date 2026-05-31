const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Exercise = require('./models/Exercise');
const WorkoutSession = require('./models/WorkoutSession');
const ProgressLog = require('./models/ProgressLog');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedProgress = async () => {
    try {
        // 1. Get a user
        const user = await User.findOne();
        if (!user) {
            console.log('No user found. Please register a user first.');
            process.exit(1);
        }
        console.log(`Seeding data for user: ${user.email}`);

        // 2. Get some exercises (using regex for flexibility)
        // Try to find "Pushups" or "Push Up" or similar
        let pushUp = await Exercise.findOne({ name: 'Pushups' });
        if (!pushUp) pushUp = await Exercise.findOne({ name: 'Push Up' });
        if (!pushUp) pushUp = await Exercise.findOne({ name: { $regex: 'Push', $options: 'i' } });

        // Use Shoulder Press instead of Squat since we filtered for Chest/Shoulders
        let shoulderPress = await Exercise.findOne({ name: 'Dumbbell Shoulder Press' });
        if (!shoulderPress) shoulderPress = await Exercise.findOne({ name: 'Seated Dumbbell Press' });
        if (!shoulderPress) shoulderPress = await Exercise.findOne({ name: { $regex: 'Shoulder Press', $options: 'i' } });

        let benchPress = await Exercise.findOne({ name: 'Dumbbell Bench Press' });
        if (!benchPress) benchPress = await Exercise.findOne({ name: { $regex: 'Bench Press', $options: 'i' } });

        if (!pushUp || !shoulderPress) {
            console.log('Exercises not found. Run seedWorkouts.js first.');
            process.exit(1);
        }

        console.log(`Using exercises: ${pushUp.name}, ${shoulderPress.name}, ${benchPress ? benchPress.name : 'None'}`);

        // 3. Clear existing sessions/logs for this user
        await WorkoutSession.deleteMany({ userId: user._id });
        await ProgressLog.deleteMany({ userId: user._id });

        // 4. Generate Sessions for the last 4 weeks
        const sessions = [];
        const logs = [];
        const today = new Date();

        for (let i = 0; i < 12; i++) { // 12 sessions (3 per week approx)
            const date = new Date(today);
            date.setDate(date.getDate() - (24 - (i * 2))); // Spread over last 24 days

            // Randomize stats
            const duration = 30 + Math.floor(Math.random() * 30);
            const calories = duration * 5 + Math.floor(Math.random() * 50);

            // Create Session
            const exercisesCompleted = [
                {
                    exercise: pushUp._id,
                    sets: [
                        { weight: 0, reps: 10 + i, completed: true }, // Reps increase over time
                        { weight: 0, reps: 10 + i, completed: true },
                        { weight: 0, reps: 10 + i, completed: true }
                    ]
                },
                {
                    exercise: shoulderPress._id,
                    sets: [
                        { weight: 10 + i, reps: 10, completed: true },
                        { weight: 10 + i, reps: 10, completed: true },
                        { weight: 10 + i, reps: 10, completed: true }
                    ]
                }
            ];

            if (benchPress) {
                exercisesCompleted.push({
                    exercise: benchPress._id,
                    sets: [
                        { weight: 10 + (i * 2), reps: 10, completed: true }, // Weight increases over time
                        { weight: 10 + (i * 2), reps: 10, completed: true },
                        { weight: 10 + (i * 2), reps: 10, completed: true }
                    ]
                });
            }

            const session = new WorkoutSession({
                userId: user._id,
                date: date,
                duration: duration,
                caloriesBurned: calories,
                exercisesCompleted: exercisesCompleted
            });
            sessions.push(session);

            // Create Logs
            logs.push(new ProgressLog({
                userId: user._id,
                exerciseId: pushUp._id,
                date: date,
                maxWeight: 0,
                totalReps: (10 + i) * 3,
                totalVolume: 0
            }));

            logs.push(new ProgressLog({
                userId: user._id,
                exerciseId: shoulderPress._id,
                date: date,
                maxWeight: 10 + i,
                totalReps: 30,
                totalVolume: (10 + i) * 30
            }));

            if (benchPress) {
                logs.push(new ProgressLog({
                    userId: user._id,
                    exerciseId: benchPress._id,
                    date: date,
                    maxWeight: 10 + (i * 2),
                    totalReps: 30,
                    totalVolume: (10 + (i * 2)) * 30
                }));
            }
        }

        await WorkoutSession.insertMany(sessions);
        await ProgressLog.insertMany(logs);

        console.log(`Seeded ${sessions.length} sessions and ${logs.length} progress logs.`);
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedProgress();
