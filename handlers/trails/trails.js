'use strict';

require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');
app.use(cors());

const superagent = require('superagent');
const handleError = require('../error/server500.js');

function Trail(item) {
  this.name = item.name;
  this.location = item.length;
  this.length = item.length;
  this.stars = item.stars;
  this.star_votes = item.starvotes;
  this.summary = item.summary;
  this.trail_url = item.url;
  this.conditions = item.conditionStatus;
  this.condition_date = item.conditionDate.slice(0, 10);
  this.condition_time = item.conditionDate.slice(11, 19);
}

module.exports = function handleTrails(request, response) {

  const { latitude, longitude } = request.query;
  const key = process.env.TRAILS_API_KEY;
  const url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxDistance=10&key=${key}`;

  superagent.get(url)
    .then(result => {
      const data = result.body.trails;
      const results = [];
      data.map(item => results.push(new Trail(item)));
      response.send(results);
    })
    .catch(error => {
      handleError(error, response);
    });
}