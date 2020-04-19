'use strict';

require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');
app.use(cors());

const superagent = require('superagent');

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));


const searchDatabase = require('../database/searchDatabase.js');
const saveToDatabase = require('../database/saveToDatabase.js');
const handleError = require('../error/server500.js');

function Location(city, result) {
  this.search_query = city;
  this.formatted_query = result.formatted_address;
  this.latitude = result.geometry.location.lat;
  this.longitude = result.geometry.location.lng;
}

module.exports = function handleLocation(request, response) {

  let dbSql = { searchQuery: request.query.city, endpoint: 'locations' }
  let city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=${key}`;

  searchDatabase(dbSql)
    .then(result => {
      if (result.rowCount > 0) response.send(result.rows[0]);
      else {
        superagent.get(url).then(result => {
          let location = new Location(city, result.body.results[0]);
          dbSql.columns = Object.keys(location).join();
          dbSql.values = Object.values(location);
          saveToDatabase(dbSql)
            .then(data => {
              location.id = data.rows[0].id;
              response.send(location);
            })
        }).catch(err => handleError(err, response));
      }
    })
}

