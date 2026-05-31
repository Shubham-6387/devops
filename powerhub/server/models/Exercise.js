const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        enum: ['strength', 'cardio', 'flexibility', 'core'],
        required: true
    },
    targetMuscles: [{
        type: String
    }],
    equipment: {
        type: String,
        enum: ['none', 'dumbbells', 'resistance_bands', 'gym', 'barbell', 'machine', 'kettlebell', 'other'],
        default: 'none'
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    instructions: [{
        type: String
    }],
    safetyTips: [{
        type: String
    }],
    commonMistakes: [{
        type: String
    }],
    recommendedSets: {
        type: Number,
        default: 3
    },
    recommendedReps: {
        type: String, // e.g., "10-12" or "30s"
        default: "10-12"
    },
    gifUrl: {
        type: String // URL to GIF or image
    }
}, { timestamps: true });

module.exports = mongoose.model('Exercise', exerciseSchema);
