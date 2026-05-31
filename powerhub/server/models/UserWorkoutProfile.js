const mongoose = require('mongoose');

const userWorkoutProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  // Optional physical metrics for diet calculations
  weight: {
    type: Number, // kg
    required: false
  },
  height: {
    type: Number, // cm
    required: false
  },
  // Activity & goal fields
  activityLevel: {
    type: String,
    enum: ['sedentary', 'moderate', 'active'],
    default: 'moderate'
  },
  goal: {
    type: String,
    enum: ['muscle_gain', 'weight_loss', 'maintenance'],
    default: 'maintenance'
  },
  fitnessGoal: {
    type: String,
    enum: ['weight_loss', 'weight_gain', 'strength', 'general_fitness'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  equipment: {
    type: String,
    enum: ['none', 'dumbbells', 'resistance_bands', 'gym'],
    required: true
  },
  dailyDuration: {
    type: Number, // in minutes
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('UserWorkoutProfile', userWorkoutProfileSchema);
