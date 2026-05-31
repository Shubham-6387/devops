import api from '../api';

// API_URL handled in ../api.js

// Scan Barcode
const scanBarcode = async (barcode) => {
    const response = await api.post('/api/v1/scan/', { barcode });
    return response.data;
};

// Get History
const getHistory = async () => {
    const response = await api.get('/api/v1/scan/history');
    return response.data;
};

const scanService = {
    scanBarcode,
    getHistory,
};

export default scanService;
