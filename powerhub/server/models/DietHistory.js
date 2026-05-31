const mongoose = require('mongoose');

const dietHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 }, // grams
    totalCarbs: { type: Number, default: 0 }, // grams
    totalFats: { type: Number, default: 0 }, // grams
    avgHealthScore: { type: Number, default: 0 },
    logCount: { type: Number, default: 0 }
}, { timestamps: true });

// Index for fast date-range queries
dietHistorySchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('DietHistory', dietHistorySchema);
