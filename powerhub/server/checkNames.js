const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exercise = require('./models/Exercise');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const checkNames = async () => {
    try {
        const exercises = await Exercise.find({}, 'name').limit(20);
        console.log(exercises.map(e => e.name));

        const pushUp = await Exercise.findOne({ name: { $regex: 'Push', $options: 'i' } });
        console.log('Push Up match:', pushUp ? pushUp.name : 'None');

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

checkNames();
