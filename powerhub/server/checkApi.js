const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const checkApi = async () => {
    try {
        // 1. Login to get token (assuming a user exists, or create one)
        // Let's try to login with a known user or create one directly in DB
        await connectDB();

        let user = await User.findOne({ email: 'test@example.com' });
        if (!user) {
            user = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        }

        // We need to login via API to get the token properly signed
        const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        // 2. Fetch exercises
        const res = await axios.get('http://localhost:5000/api/v1/workouts/exercises', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.length > 0) {
            console.log('First Exercise:', JSON.stringify(res.data[0], null, 2));
        } else {
            console.log('No exercises found');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

checkApi();
