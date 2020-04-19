'use strict';


require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');
app.use(cors());

const superagent = require('superagent');
const handleError = require('../error/server500.js');

function Weather(date, weatherData) {
  this.forecast = weatherData;
  this.time = new Date(date).toDateString();
}

module.exports = function handleWeather(request, response) {

  const { latitude, longitude } = request.query;
  const key = process.env.WEATHER_API_KEY;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${key}&days=7`;

  superagent.get(url).then(weatherResponse => {
    const data = weatherResponse.body.data;
    const results = [];
    data.map(item => results.push(new Weather(item.datetime, item.weather.description)));
    response.send(results);
  }).catch(err => handleError(err, response));
}