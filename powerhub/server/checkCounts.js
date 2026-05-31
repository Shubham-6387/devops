const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exercise = require('./models/Exercise');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const checkCounts = async () => {
    try {
        const total = await Exercise.countDocuments();
        console.log(`Total Exercises: ${total}`);

        const muscles = await Exercise.distinct('targetMuscles');
        console.log('Muscles found:', muscles);

        for (const m of muscles) {
            const count = await Exercise.countDocuments({ targetMuscles: m });
            console.log(`${m}: ${count}`);
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

checkCounts();
