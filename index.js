const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const dotEnv = require('dotenv');
const app = express();

app.use(cors());
app.use(express.json());
dotEnv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const Location = mongoose.model('Location', { location: String, city: String, state: String, country: String });

const API_KEY = process.env.API_KEY;

app.get('/weather', async (req, res) => {
    const { village, city, state, country, lat, lon } = req.query;
    console.log(typeof(lat), lon);
    try {
        let locationQuery;
        if (village) {
            locationQuery = village;
        } else if (city) {
            locationQuery = city;
        } else if (state) {
            locationQuery = state;
        } else {
            locationQuery = country;
        }

        const geoResponse = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${locationQuery}&limit=1&appid=${API_KEY}`);
        if (geoResponse.data.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }

        const weatherResponse = await axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        res.json(weatherResponse.data);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch weather data' });
    }
});

app.post('/weather/name', async (req, res) => {
    const { location, city, state, country } = req.body;

    try {
        let searchQuery = location;
        if(city) searchQuery += `,${city}`;
        if (state) searchQuery += `, ${state}`;
        if (country) searchQuery += `, ${country}`;

        const osmResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: searchQuery,
                format: 'json',
                limit: 1
            }
        });

        const osmData = osmResponse.data;

        if (osmData.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }

        const { lat, lon, name } = osmData[0];

        const weatherResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                lat: lat,
                lon: lon,
                appid: API_KEY,
                units: 'metric'
            }
        });

        const weatherData = weatherResponse.data;

        if (!weatherData) {
            return res.status(404).json({ error: 'Weather data not found' });
        }

        res.json(weatherData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

app.get('/weather/hourly', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const hourlyResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                lat: lat,
                lon: lon,
                appid: API_KEY,
                units: 'metric'
            }
        });
        res.json(hourlyResponse.data);
    } catch (error) {
        console.error('Error fetching hourly forecast data:', error.message);
        res.status(500).json({ error: 'Could not fetch hourly forecast data' });
    }
});

app.get('/weather/daily', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const dailyResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                lat: lat,
                lon: lon,
                appid: API_KEY,
                units: 'metric'
            }
        });
        res.json(dailyResponse.data);
    } catch (error) {
        console.error('Error fetching daily forecast data:', error.message);
        res.status(500).json({ error: 'Could not fetch daily forecast data' });
    }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
