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


const PORT = process.env.PORT;

app.get('/', (request, response) => {
  response.send('Home route working');
})
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);




function Location(city, result) {
  this.search_query = city;
  this.formatted_query = result.body.results[0].formatted_address;
  this.latitude = result.body.results[0].geometry.location.lat;
  this.longitude = result.body.results[0].geometry.location.lng;

}
function Weather(date, weatherData) {
  this.forecast = weatherData;
  this.time = new Date(date).toDateString();
}
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




function handleLocation(request, response) {

  let city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=${key}`;

  let sql = `SELECT * FROM locations WHERE search_query=$1;`;
  let values = [city];

  client.query(sql, values).then(result => {
    if (result.rowCount > 0) response.send(result.rows[0]);
    else {
      console.log('first test')
      superagent.get(url).then(result => {

        let location = new Location(city, result);
        let insertSql = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING ID;`;
        let newValues = Object.values(location)
        console.log(newValues);
        client.query(insertSql, newValues)
          .then(data => {
            location.id = data.rows[0].id;
            response.send(location);
          })
      }).catch(err => handleError(err, response));
    }

  }
  )
}

function handleWeather(request, response) {

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


function handleTrails(request, response) {
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
      errorHandler(error, request, response);
    });

}





function handleError(err, response) {
  console.log(err);
  if (response) response.status(500).send('Sorry something went wrong');
}


app.get('*', (error, response) => {
  response.status(500).send('Sorry, the server is having a moment...');
})

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Lookin good on PORT ${PORT}!`)
    })
  })