const UserWorkoutProfile = require('../models/UserWorkoutProfile');
const Exercise = require('../models/Exercise');
const WorkoutRoutine = require('../models/WorkoutRoutine');
const WorkoutSession = require('../models/WorkoutSession');
const WeeklyPlan = require('../models/WeeklyPlan');
const ProgressLog = require('../models/ProgressLog');
const Note = require('../models/Note');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');

// --- Profile ---
exports.createOrUpdateProfile = async (req, res) => {
    try {
        const { age, gender, fitnessGoal, experienceLevel, equipment, dailyDuration, weight, height, activityLevel, goal } = req.body;
        const userId = req.user.id; // Assuming auth middleware adds user to req

        let profile = await UserWorkoutProfile.findOne({ userId });
        if (profile) {
            profile = await UserWorkoutProfile.findOneAndUpdate(
                { userId },
                { age, gender, fitnessGoal, experienceLevel, equipment, dailyDuration, weight, height, activityLevel, goal },
                { new: true }
            );
        } else {
            profile = new UserWorkoutProfile({
                userId, age, gender, fitnessGoal, experienceLevel, equipment, dailyDuration, weight, height, activityLevel, goal
            });
            await profile.save();
        }
        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const profile = await UserWorkoutProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Exercises ---
exports.getExercises = async (req, res) => {
    try {
        const { muscle, equipment, difficulty, search } = req.query;
        let query = {};

        if (muscle) {
            const muscleMap = {
                chest: ['chest'],
                back: ['lats', 'middle back', 'lower back', 'traps', 'neck'],
                legs: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'abductors', 'adductors'],
                shoulders: ['shoulders'],
                arms: ['biceps', 'triceps', 'forearms'],
                core: ['abdominals']
            };

            const targetMuscles = muscleMap[muscle.toLowerCase()];
            if (targetMuscles) {
                query.targetMuscles = { $in: targetMuscles };
            } else {
                query.targetMuscles = muscle; // Fallback for direct matches
            }
        }

        if (equipment) query.equipment = equipment;
        if (difficulty) query.difficulty = difficulty;
        if (search) query.name = { $regex: search, $options: 'i' };

        const exercises = await Exercise.find(query);
        res.json(exercises);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getExerciseById = async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);
        if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Routines ---
exports.generateRoutine = async (req, res) => {
    try {
        const profile = await UserWorkoutProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(400).json({ message: 'Create a profile first' });

        // 1. Try exact match
        let routines = await WorkoutRoutine.find({
            goal: profile.fitnessGoal,
            level: profile.experienceLevel
        }).populate('exercises.exercise');

        // 2. Fallback: Match goal only
        if (routines.length === 0) {
            routines = await WorkoutRoutine.find({
                goal: profile.fitnessGoal
            }).populate('exercises.exercise');
        }

        // 3. Fallback: Match level only
        if (routines.length === 0) {
            routines = await WorkoutRoutine.find({
                level: profile.experienceLevel
            }).populate('exercises.exercise');
        }

        // 4. Ultimate Fallback: Return ANY routine
        if (routines.length === 0) {
            routines = await WorkoutRoutine.find().populate('exercises.exercise');
        }

        res.json(routines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRoutines = async (req, res) => {
    try {
        const routines = await WorkoutRoutine.find();
        res.json(routines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.getRoutineById = async (req, res) => {
    try {
        const routine = await WorkoutRoutine.findById(req.params.id).populate('exercises.exercise');
        if (!routine) return res.status(404).json({ message: 'Routine not found' });
        res.json(routine);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Sessions ---
exports.createRoutine = async (req, res) => {
    try {
        const { name, exercises, goal, level } = req.body;
        // Basic validation
        if (!exercises || exercises.length === 0) {
            return res.status(400).json({ message: 'Exercises are required' });
        }

        const routine = new WorkoutRoutine({
            name: name || `Custom Routine - ${new Date().toLocaleDateString()}`,
            goal: 'general_fitness', // Default enum value
            level: 'intermediate',   // Default enum value
            equipment: 'gym',        // Default enum value (required)
            duration: 45,            // Default estimate
            exercises: exercises.map(ex => ({
                exercise: ex._id,
                sets: 3, // Default
                reps: "12", // Default
                rest: 60 // Default
            }))
        });

        await routine.save();

        // Populate for immediate use
        const populatedRoutine = await WorkoutRoutine.findById(routine._id).populate('exercises.exercise');

        res.status(201).json(populatedRoutine);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.logSession = async (req, res) => {
    try {
        const { routineId, duration, caloriesBurned, exercisesCompleted, notes } = req.body;
        const session = new WorkoutSession({
            userId: req.user.id,
            routineId,
            duration,
            caloriesBurned,
            exercisesCompleted,
            notes
        });
        await session.save();

        // Update Progress Logs
        for (const ex of exercisesCompleted) {
            let maxWeight = 0;
            let totalReps = 0;
            let totalVolume = 0;

            ex.sets.forEach(set => {
                if (set.completed) {
                    if (set.weight > maxWeight) maxWeight = set.weight;
                    totalReps += set.reps;
                    totalVolume += (set.reps * set.weight);
                }
            });

            const log = new ProgressLog({
                userId: req.user.id,
                exerciseId: ex.exercise,
                maxWeight,
                totalReps,
                totalVolume
            });
            await log.save();
        }

        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const sessions = await WorkoutSession.find({ userId: req.user.id }).sort({ date: -1 }).populate('routineId');
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Weekly Plan ---
exports.getWeeklyPlan = async (req, res) => {
    try {
        // Get plan for current week or specific date
        // For simplicity, let's just get the latest plan or by weekStartDate
        const plan = await WeeklyPlan.findOne({ userId: req.user.id }).sort({ weekStartDate: -1 }).populate('days.routineId');
        res.json(plan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.saveWeeklyPlan = async (req, res) => {
    try {
        const { weekStartDate, days } = req.body;
        let plan = await WeeklyPlan.findOne({ userId: req.user.id, weekStartDate });

        if (plan) {
            plan.days = days;
            await plan.save();
        } else {
            plan = new WeeklyPlan({
                userId: req.user.id,
                weekStartDate,
                days
            });
            await plan.save();
        }
        res.json(plan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Progress ---
exports.getProgress = async (req, res) => {
    try {
        const { exerciseId } = req.query;
        const query = { userId: req.user.id };
        if (exerciseId) query.exerciseId = exerciseId;

        const logs = await ProgressLog.find(query).sort({ date: 1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Notes/Tasks/Reminders ---
exports.getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createNote = async (req, res) => {
    try {
        const note = new Note({ ...req.body, userId: req.user.id });
        await note.save();
        res.json(note);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const task = new Task({ ...req.body, userId: req.user.id });
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user.id }).sort({ datetime: 1 });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createReminder = async (req, res) => {
    try {
        const reminder = new Reminder({ ...req.body, userId: req.user.id });
        await reminder.save();
        res.json(reminder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
