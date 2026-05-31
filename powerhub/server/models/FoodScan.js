const mongoose = require('mongoose');

const foodScanSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        barcode: {
            type: String,
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        calories: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        sodium: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        healthScore: { type: Number }, // removed required: true to allow null
        nutritionAvailable: { type: Boolean, default: true },
        warnings: [{ type: String }],
        imageUrl: { type: String },
    },
    {
        timestamps: true,
    }
);

const FoodScan = mongoose.model('FoodScan', foodScanSchema);

module.exports = FoodScan;
