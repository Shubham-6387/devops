const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WorkoutSession = require('./models/WorkoutSession');
const ProgressLog = require('./models/ProgressLog');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const checkData = async () => {
    try {
        const sessions = await WorkoutSession.find();
        const logs = await ProgressLog.find();

        console.log(`Total Sessions: ${sessions.length}`);
        console.log(`Total Progress Logs: ${logs.length}`);

        if (sessions.length > 0) {
            console.log('Sample Session:', JSON.stringify(sessions[0], null, 2));
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

checkData();
