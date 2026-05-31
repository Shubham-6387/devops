const mongoose = require('mongoose');

const workoutRoutineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    goal: {
        type: String,
        enum: ['weight_loss', 'weight_gain', 'strength', 'general_fitness'],
        required: true
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    equipment: {
        type: String,
        enum: ['none', 'dumbbells', 'resistance_bands', 'gym'],
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    exercises: [{
        exercise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise'
        },
        sets: Number,
        reps: String,
        order: Number,
        section: {
            type: String,
            enum: ['warmup', 'main', 'cooldown'],
            default: 'main'
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('WorkoutRoutine', workoutRoutineSchema);
