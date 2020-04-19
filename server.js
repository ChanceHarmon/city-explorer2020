'use strict';
//Modular Refactor
require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT;

const handleLocation = require('./handlers/location/location');
const handleWeather = require('./handlers/weather/weather');
const handleTrails = require('./handlers/trails/trails')
const handleMovies = require('./handlers/movies/movie');
const handleYelp = require('./handlers/yelp/yelp')

app.get('/', (request, response) => {
  response.send('Home route working');
})
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.get('/movies', handleMovies);
app.get('/yelp', handleYelp);

app.get('*', (error, response) => {
  response.status(500).send('Sorry, the server is having a moment...');
})

app.listen(PORT, () => console.log(`Lookin good on PORT ${PORT}`));