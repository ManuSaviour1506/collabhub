import axios from 'axios';

// Use environment variable if available, otherwise use localhost
const API_URL =  'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;