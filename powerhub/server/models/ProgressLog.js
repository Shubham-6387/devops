const mongoose = require('mongoose');

const progressLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    maxWeight: {
        type: Number // Max weight lifted in this session
    },
    totalReps: {
        type: Number
    },
    totalVolume: {
        type: Number // weight * reps * sets
    }
}, { timestamps: true });

module.exports = mongoose.model('ProgressLog', progressLogSchema);
