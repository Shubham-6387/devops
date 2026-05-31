// server/services/dietEngine.js

// Mifflin-St Jeor Formula
function calculateBMR({ weight, height, age, gender }) {
  return gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

function calculateTDEE(bmr, activityLevel) {
  const factors = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.75
  };
  return bmr * (factors[activityLevel] || 1.2);
}

function calculateMacros(calories, goal) {
  if (goal === "muscle_gain") {
    return { protein: 0.35, carbs: 0.45, fats: 0.2 };
  }
  if (goal === "weight_loss") {
    return { protein: 0.4, carbs: 0.35, fats: 0.25 };
  }
  return { protein: 0.3, carbs: 0.5, fats: 0.2 };
}

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateMacros
};
