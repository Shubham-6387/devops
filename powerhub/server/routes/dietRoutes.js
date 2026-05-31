const express = require("express");
const router = express.Router();
const { getDietSummary, saveDietLog, getDietHistory, getAnalytics } = require("../controllers/dietController");
const { protect } = require("../middleware/authMiddleware");

router.get("/summary", protect, getDietSummary);
router.post("/save", protect, saveDietLog);
router.get("/history", protect, getDietHistory);
router.get("/analytics", protect, getAnalytics);

module.exports = router; 
