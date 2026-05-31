const express = require('express');
const router = express.Router();
const FoodScan = require('../models/FoodScan');
const { analyzeFood } = require('../services/foodService');
const { protect } = require('../middleware/authMiddleware');

// @desc    Scan and Analyze Barcode
// @route   POST /api/v1/scan
// @access  Private
const DietHistory = require('../models/DietHistory');
const HealthScoreLog = require('../models/HealthScoreLog');

// @desc    Scan and Analyze Barcode
// @route   POST /api/v1/scan
// @access  Private
const scanBarcode = async (req, res) => {
    const { barcode } = req.body;

    if (!barcode) {
        return res.status(400).json({ message: 'Barcode is required' });
    }

    try {
        const analysis = await analyzeFood(barcode);

        // Save to DB
        const scan = await FoodScan.create({
            userId: req.user._id,
            barcode,
            ...analysis,
        });

        // --- INTELLIGENT AGGREGATION ---

        // 1. Update Daily Diet History
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dailyLog = await DietHistory.findOne({ userId: req.user._id, date: today });

        if (dailyLog) {
            dailyLog.totalCalories += scan.calories;
            dailyLog.totalProtein += scan.protein;
            dailyLog.totalCarbs += (scan.carbs || 0);
            dailyLog.totalFats += scan.fat;
            // Weighted average for health score? Simple average for now.
            const totalScore = (dailyLog.avgHealthScore * dailyLog.logCount) + (scan.healthScore || 0);
            dailyLog.logCount += 1;
            dailyLog.avgHealthScore = Math.round(totalScore / dailyLog.logCount);
            await dailyLog.save();
        } else {
            await DietHistory.create({
                userId: req.user._id,
                date: today,
                totalCalories: scan.calories,
                totalProtein: scan.protein,
                totalCarbs: (scan.carbs || 0),
                totalFats: scan.fat,
                avgHealthScore: scan.healthScore || 0,
                logCount: 1
            });
        }

        // 2. Update Weekly Health Score Log (If a score changed significantly or is new)
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(today.getDate() - today.getDay()); // Sunday start

        // We'll just overwrite/update the log for this week with a simple average of "DietHistory" if needed,
        // or just log this scan's impact. 
        // Strategy: Let's log a snapshot if it's the first scan of the day/week.

        // Simpler: Just save a snapshot for today if one exists, or create new.
        // Actually, let's keep it simple: Analytics will calculate the trend from DietHistory. 
        // HealthScoreLog can be used for "Weekly Summary" snapshots.

        // For now, let's just make sure we HAVE data.

        res.status(201).json(scan);
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: error.message || 'Product not found' });
    }
};

// @desc    Get Scan History
// @route   GET /api/v1/scan/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const history = await FoodScan.find({ userId: req.user._id }).sort({
            createdAt: -1,
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

router.post('/', protect, scanBarcode);
router.get('/history', protect, getHistory);

module.exports = router;
