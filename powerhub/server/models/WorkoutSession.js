const mongoose = require('mongoose');

const workoutSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    routineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkoutRoutine'
    },
    date: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    caloriesBurned: {
        type: Number
    },
    exercisesCompleted: [{
        exercise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise'
        },
        sets: [{
            reps: Number,
            weight: Number, // in kg/lbs
            completed: Boolean
        }]
    }],
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);
