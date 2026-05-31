const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Exercise = require('./models/Exercise');
const WorkoutRoutine = require('./models/WorkoutRoutine');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
    try {
        await Exercise.deleteMany();
        await WorkoutRoutine.deleteMany();

        // Load exercises from the downloaded JSON file
        const exercisesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'exercises_dump.json'), 'utf-8'));

        // Helper to map JSON data to our schema
        const mapExercise = (ex) => {
            // Base URL for images from the repo
            const baseUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

            // Map common exercises to Giphy URLs for demo purposes
            const gifMap = {
                // Cardio / Bodyweight
                'Jumping Jacks': 'https://media.giphy.com/media/clWZCO2i2g7Wo/giphy.gif',
                'Star Jump': 'https://media.giphy.com/media/5t9IcRmVOe1A4/giphy.gif',
                'Burpee': 'https://media.giphy.com/media/23hPPmr8PnmjwRfS/giphy.gif',
                'Mountain Climber': 'https://media.giphy.com/media/13t2OTCFzCqJbO/giphy.gif',
                'High Knees': 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif',

                // Legs
                'Squat': 'https://media.giphy.com/media/12h4xwPxNCAxxe/giphy.gif',
                'Bodyweight Squat': 'https://media.giphy.com/media/12h4xwPxNCAxxe/giphy.gif',
                'Lunge': 'https://media.giphy.com/media/l3q2Q3sUEkEyDvfTZC/giphy.gif',
                'Bodyweight Lunge': 'https://media.giphy.com/media/l3q2Q3sUEkEyDvfTZC/giphy.gif',

                // Upper Body - Push
                'Push Up': 'https://media.giphy.com/media/wwNv7s3k4qWJO/giphy.gif',
                'Pushups': 'https://media.giphy.com/media/wwNv7s3k4qWJO/giphy.gif',
                'Dumbbell Bench Press': 'https://media.giphy.com/media/61T05t2sSQfFC/giphy.gif',
                'Dumbbell Shoulder Press': 'https://media.giphy.com/media/wM0IbbcNmwOR2/giphy.gif',
                'Seated Dumbbell Press': 'https://media.giphy.com/media/wM0IbbcNmwOR2/giphy.gif',
                'Tricep Extension': 'https://media.giphy.com/media/3o7qE5866bLg4PcnRw/giphy.gif',
                'Seated Triceps Press': 'https://media.giphy.com/media/3o7qE5866bLg4PcnRw/giphy.gif',

                // Upper Body - Pull
                'Dumbbell Row': 'https://media.giphy.com/media/p8yq7b2tNn4vm/giphy.gif', // Fallback
                'Bent Over Dumbbell Row': 'https://media.giphy.com/media/p8yq7b2tNn4vm/giphy.gif', // Fallback
                'Bicep Curl': 'https://media.giphy.com/media/wKwTcfz10bLwc/giphy.gif',
                'Dumbbell Bicep Curl': 'https://media.giphy.com/media/wKwTcfz10bLwc/giphy.gif',

                // Core
                'Plank': 'https://media.giphy.com/media/p8yq7b2tNn4vm/giphy.gif',
            };

            // Check map, then repo images
            let gifUrl = gifMap[ex.name] || (ex.images && ex.images.length > 0 ? baseUrl + ex.images[0] : null);

            // STRICT FILTER: If no visual content, skip this exercise
            if (!gifUrl) return null;

            // Map equipment to match our schema enum
            let equipment = ex.equipment || 'none';
            if (equipment === 'body only') equipment = 'none';
            if (equipment === 'other') equipment = 'gym';
            if (equipment === 'machine') equipment = 'gym';
            if (equipment === 'foam roll') equipment = 'none';
            if (equipment === 'kettlebells') equipment = 'dumbbells';
            if (equipment === 'dumbbell') equipment = 'dumbbells'; // Fix singular
            if (equipment === 'cable') equipment = 'gym';
            if (equipment === 'bands') equipment = 'none';
            if (equipment === 'medicine ball') equipment = 'none';
            if (equipment === 'exercise ball') equipment = 'none';
            if (equipment === 'e-z curl bar') equipment = 'barbell';

            // Ensure category is valid
            let category = ex.category || 'strength';
            if (category === 'stretching') category = 'flexibility'; // If 'stretching' not in enum
            if (category === 'plyometrics') category = 'cardio';
            if (category === 'strongman') category = 'strength';
            if (category === 'powerlifting') category = 'strength';
            if (category === 'olympic weightlifting') category = 'strength';

            // Ensure difficulty is valid
            let difficulty = ex.level || 'beginner';
            if (difficulty === 'expert') difficulty = 'advanced';

            return {
                name: ex.name,
                category: category,
                targetMuscles: ex.primaryMuscles || [],
                equipment: equipment,
                difficulty: difficulty,
                instructions: ex.instructions || [],
                recommendedSets: 3,
                recommendedReps: '10-12',
                gifUrl: gifUrl
            };
        };

        // Map all exercises and filter out those with no visuals
        const exercises = exercisesData.map(mapExercise).filter(e => e !== null);

        const createdExercises = await Exercise.insertMany(exercises);

        // Helper to find exercise ID
        const findEx = (name) => createdExercises.find(e => e.name === name)?._id;

        // Create diverse routines
        const routines = [
            {
                name: 'Full Body Blast',
                goal: 'general_fitness',
                level: 'beginner',
                equipment: 'none',
                duration: 30,
                exercises: [
                    { exercise: findEx('Jumping Jacks') || findEx('Star Jump'), sets: 2, reps: '30s', order: 1, section: 'warmup' },
                    { exercise: findEx('Squat') || findEx('Bodyweight Squat'), sets: 3, reps: '12', order: 2, section: 'main' },
                    { exercise: findEx('Push Up') || findEx('Pushups'), sets: 3, reps: '10', order: 3, section: 'main' },
                    { exercise: findEx('Lunge') || findEx('Bodyweight Lunge'), sets: 3, reps: '10', order: 4, section: 'main' },
                    { exercise: findEx('Plank'), sets: 3, reps: '30s', order: 5, section: 'main' }
                ].filter(e => e.exercise)
            },
            {
                name: 'Upper Body Strength',
                goal: 'strength',
                level: 'intermediate',
                equipment: 'dumbbells',
                duration: 45,
                exercises: [
                    { exercise: findEx('Dumbbell Bench Press'), sets: 4, reps: '10', order: 1, section: 'main' },
                    { exercise: findEx('Dumbbell Row') || findEx('Bent Over Dumbbell Row'), sets: 4, reps: '10', order: 2, section: 'main' },
                    { exercise: findEx('Dumbbell Shoulder Press') || findEx('Seated Dumbbell Press'), sets: 3, reps: '12', order: 3, section: 'main' },
                    { exercise: findEx('Bicep Curl') || findEx('Dumbbell Bicep Curl'), sets: 3, reps: '12', order: 4, section: 'main' },
                    { exercise: findEx('Tricep Extension') || findEx('Seated Triceps Press'), sets: 3, reps: '12', order: 5, section: 'main' }
                ].filter(e => e.exercise)
            }
        ];

        await WorkoutRoutine.insertMany(routines);

        console.log(`Data Seeded! Inserted ${createdExercises.length} exercises.`);
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();
