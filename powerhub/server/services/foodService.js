const axios = require("axios");

/**
 * Calculate realistic health score (0–100)
 * based on nutrient density and processing level
 */
function calculateHealthScore(nutriments) {
  if (!nutriments) return null;

  let score = 100;

  const sugar = nutriments["sugars_100g"] || 0;
  const fat = nutriments["fat_100g"] || 0;
  const sodium = nutriments["sodium_100g"] || 0; // grams
  const calories = nutriments["energy-kcal_100g"] || 0;
  const protein = nutriments["proteins_100g"] || 0;
  const fiber = nutriments["fiber_100g"] || 0;
  const nova = nutriments["nova_group"];

  /* ❌ STRONG PENALTIES */
  score -= sugar * 2.5;        // sugar penalty
  score -= fat * 2;            // fat penalty
  score -= sodium * 15;        // sodium penalty
  score -= calories * 0.08;    // calorie density penalty

  /* ❌ Ultra-processed food penalty */
  if (nova === 4 || calories > 350) {
    score -= 20;
  }

  /* ✅ LIMITED BONUSES */
  score += Math.min(protein * 1.2, 10); // cap protein bonus
  score += Math.min(fiber * 3, 15);     // cap fiber bonus

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

const analyzeFood = async (barcode) => {
  try {
    const url = `${process.env.FOOD_API_BASE}/api/v2/product/${barcode}.json`;
    const response = await axios.get(url);

    if (response.data.status === 0) {
      throw new Error("Product not found");
    }

    const product = response.data.product;
    const nutriments = product.nutriments || {};

    // Basic product info
    const productName = product.product_name || "Unknown Product";
    const imageUrl = product.image_url || "";

    // Nutrients (per 100g)
    const calories = nutriments["energy-kcal_100g"] || 0;
    const sugar = nutriments["sugars_100g"] || 0;
    const fat = nutriments["fat_100g"] || 0;
    const sodium = nutriments["sodium_100g"] || 0;
    const protein = nutriments["proteins_100g"] || 0;
    const carbs = nutriments["carbohydrates_100g"] || 0;

    // Warnings
    const warnings = [];
    if (sugar > 10) warnings.push("High Sugar");
    if (sodium > 0.4) warnings.push("High Sodium"); // 400mg
    if (nutriments["nova_group"] === 4)
      warnings.push("Ultra-processed food");

    // Health score
    const healthScore = calculateHealthScore(nutriments);

    return {
      productName,
      calories,
      sugar,
      fat,
      sodium,
      protein,
      carbs,
      healthScore,
      nutritionAvailable: true,
      warnings,
      imageUrl,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { analyzeFood };