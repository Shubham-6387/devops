const mongoose = require('mongoose');

const dietLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    calories: {
        type: Number,
        required: true
    },
    macros: {
        protein: {
            grams: Number,
            kcal: Number
        },
        carbs: {
            grams: Number,
            kcal: Number
        },
        fats: {
            grams: Number,
            kcal: Number
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('DietLog', dietLogSchema);
