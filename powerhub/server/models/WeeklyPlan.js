const mongoose = require('mongoose');

const weeklyPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    weekStartDate: {
        type: Date,
        required: true
    },
    days: [{
        dayOfWeek: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        routineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WorkoutRoutine'
        },
        isRestDay: {
            type: Boolean,
            default: false
        },
        customActivity: String // For custom workouts not in DB
    }]
}, { timestamps: true });

module.exports = mongoose.model('WeeklyPlan', weeklyPlanSchema);
