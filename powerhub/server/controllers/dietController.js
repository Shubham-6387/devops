const UserWorkoutProfile = require("../models/UserWorkoutProfile");
const ProgressLog = require("../models/ProgressLog");
const { calculateBMR, calculateTDEE, calculateMacros } = require("../services/dietEngine");

exports.getDietSummary = async (req, res) => {
  try {
    const profile = await UserWorkoutProfile.findOne({ userId: req.user.id });

    // if (!profile) {
    //   return res.status(404).json({ message: "Profile not found" });
    // }
    const defaultProfile = { weight: 70, height: 170, age: 30, gender: 'male', fitnessGoal: 'maintenance', activityLevel: 'moderate' };
    const safeProfile = profile || defaultProfile;

    // Use profile values or defaults for calculation
    const weight = safeProfile.weight || 70;
    const height = safeProfile.height || 170;
    const age = safeProfile.age || 30;
    const gender = safeProfile.gender || 'male';

    // Map existing fitnessGoal to diet goal if necessary
    let goal = 'maintenance';
    const pGoal = safeProfile.fitnessGoal;
    if (pGoal === 'weight_gain' || pGoal === 'strength') {
      goal = 'muscle_gain';
    } else if (pGoal === 'weight_loss') {
      goal = 'weight_loss';
    } else if (safeProfile.goal) {
      goal = safeProfile.goal;
    } else if (pGoal) {
      if (pGoal.includes('loss')) goal = 'weight_loss';
      if (pGoal.includes('gain')) goal = 'muscle_gain';
    }

    const activityLevel = safeProfile.activityLevel || inferActivityLevelFromDuration(safeProfile.dailyDuration);

    const bmr = calculateBMR({ weight, height, age, gender });
    const tdee = calculateTDEE(bmr, activityLevel);
    const standardMacros = calculateMacros(tdee, goal);

    // --- Override Protein Calculation (Weight Based) ---
    // User Requirement: 2g of protein per kg of body weight
    const proteinGrams = Math.round(weight * 2.0);
    const proteinKcal = proteinGrams * 4;

    // Remaining calories for Carbs and Fats
    const remainingKcal = tdee - proteinKcal;

    // Re-distribute remaining calories based on the original ratio between Carbs and Fats
    // Example: If original was 45% Carb, 20% Fat -> Ratio is 45:20
    const totalRatio = standardMacros.carbs + standardMacros.fats;
    const carbsShare = standardMacros.carbs / totalRatio;
    const fatsShare = standardMacros.fats / totalRatio;

    const carbsKcal = Math.round(remainingKcal * carbsShare);
    const fatsKcal = Math.round(remainingKcal * fatsShare);

    const carbsGrams = Math.round(carbsKcal / 4);
    const fatsGrams = Math.round(fatsKcal / 9);

    res.json({
      calories: Math.round(tdee),
      macros: {
        protein: { kcal: proteinKcal, grams: proteinGrams },
        carbs: { kcal: carbsKcal, grams: carbsGrams },
        fats: { kcal: fatsKcal, grams: fatsGrams }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const DietLog = require("../models/DietLog");

exports.saveDietLog = async (req, res) => {
  try {
    const { calories, macros } = req.body;

    const log = await DietLog.create({
      userId: req.user.id,
      calories,
      macros
    });

    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save diet log" });
  }
};

exports.getDietHistory = async (req, res) => {
  try {
    const logs = await DietLog.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch diet history" });
  }
};

function inferActivityLevelFromDuration(durationMinutes = 30) {
  if (durationMinutes >= 60) return 'active';
  if (durationMinutes >= 30) return 'moderate';
  return 'sedentary';
}

const DietHistory = require("../models/DietHistory");
const FoodScan = require("../models/FoodScan");

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch Existing History
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    let history = await DietHistory.find({
      userId,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    // --- DEMO DATA GENERATION (If insufficient data) ---
    if (history.length < 3) {
      const profile = await UserWorkoutProfile.findOne({ userId });
      const weight = profile?.weight || 70;
      const height = profile?.height || 170;
      const age = profile?.age || 30;
      const gender = profile?.gender || 'male';

      const bmr = calculateBMR({ weight, height, age, gender });
      const tdee = calculateTDEE(bmr, 'moderate'); // Assume moderate for baseline

      // Generate fake history for missing days
      const filledHistory = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        d.setHours(0, 0, 0, 0);

        // Check if we have real data for this day
        const existing = history.find(h => new Date(h.date).toDateString() === d.toDateString());

        if (existing) {
          filledHistory.push(existing);
        } else {
          // Generate distinct random variance +- 20%
          const variance = (Math.random() * 0.4) - 0.2;
          const calories = Math.round(tdee * (1 + variance));
          const protein = Math.round((weight * 2.0) * (1 + (Math.random() * 0.2 - 0.1)));

          // Distributed remainder
          const remaining = calories - (protein * 4);
          const carbs = Math.round((remaining * 0.5) / 4);
          const fats = Math.round((remaining * 0.5) / 9);

          filledHistory.push({
            date: d,
            totalCalories: calories,
            totalProtein: protein,
            totalCarbs: carbs,
            totalFats: fats,
            avgHealthScore: Math.round(60 + (Math.random() * 30)), // 60-90 score
            isDemo: true
          });
        }
      }
      history = filledHistory;
    }

    // Normalize Data for Charts
    const labels = [];
    const calorieData = [];
    const healthScoreData = [];

    history.forEach(log => {
      labels.push(new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }));
      calorieData.push(log.totalCalories);
      healthScoreData.push(log.avgHealthScore);
    });

    // 2. Weekly Macro Stack
    // Simple aggregation for now: just return the daily breakdown
    const weeklyMacros = history.map(log => ({
      day: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
      protein: log.totalProtein,
      carbs: log.totalCarbs,
      fats: log.totalFats
    }));

    // 3. Food Quality Breakdown (Last 30 Days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const recentScans = await FoodScan.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    let healthy = 0, moderate = 0, unhealthy = 0;

    if (recentScans.length > 0) {
      recentScans.forEach(scan => {
        if (scan.healthScore === null || scan.healthScore === undefined) return;
        if (scan.healthScore >= 60) healthy++;
        else if (scan.healthScore >= 40) moderate++;
        else unhealthy++;
      });
    } else {
      // Default demo data for Quality if no scans
      healthy = 12;
      moderate = 5;
      unhealthy = 3;
    }

    // 4. Smart Insights
    const insights = [];

    // Protein check
    const profile = await UserWorkoutProfile.findOne({ userId });
    const weight = profile ? (profile.weight || 70) : 70;
    const proteinTarget = weight * 2;

    const proteinDays = history.filter(h => h.totalProtein >= proteinTarget).length;
    if (proteinDays >= 4) {
      insights.push({ type: 'success', text: `You met your protein goal on ${proteinDays} days this week!` });
    } else {
      insights.push({ type: 'warning', text: `Try to increase protein intake. Goal met only ${proteinDays} days.` });
    }

    // Health Score
    const avgScore = healthScoreData.reduce((a, b) => a + b, 0) / (healthScoreData.length || 1);
    if (avgScore > 70) insights.push({ type: 'success', text: `Great food choices! Your avg health score is ${Math.round(avgScore)}.` });
    else if (avgScore < 50) insights.push({ type: 'warning', text: `Health score is low (${Math.round(avgScore)}). Try more whole foods.` });

    // Consistency Score
    const daysLogged = history.length;
    const consistencyScore = 85;

    res.json({
      dailyTrend: { labels, calorieData, healthScoreData },
      weeklyMacros,
      foodQuality: { healthy, moderate, unhealthy },
      consistencyScore,
      insights
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate analytics" });
  }
}; 
