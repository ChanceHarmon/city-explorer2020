'use strict';


//Imports and configs

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


//Routes

app.get('/', (request, response) => {
  response.send('Home route working');
})
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.get('/movies', handleMovies);
app.get('/yelp', handleYelp);



//Constructor Functions

function Location(city, result) {
  this.search_query = city;
  this.formatted_query = result.formatted_address;
  this.latitude = result.geometry.location.lat;
  this.longitude = result.geometry.location.lng;
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
function Movie(movie) {
  this.title = movie.original_title;
  this.overview = movie.overview.slice(0, 750);
  this.average_votes = movie.votes_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/original${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
}
function Yelp(yelp) {
  this.name = yelp.name;
  this.image_url = yelp.image_url;
  this.price = yelp.price;
  this.rating = yelp.rating;
  this.url = yelp.url;
}

//API Functions

function handleLocation(request, response) {

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
      handleError(error, response);
    });
}

function handleMovies(request, response) {

  const movieQuery = request.query.search_query;
  const key = process.env.MOVIE_API_KEY;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${movieQuery}`;

  superagent.get(url)
    .then(movieResults => {
      const movie = movieResults.body.results;
      response.send(movie.map(result => {
        return new Movie(result);
      }))
    }).catch(error => handleError(error, response))
}

function handleYelp(request, response) {

  const { latitude, longitude } = request.query;
  const key = process.env.YELP_API_KEY;
  const url = `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}`;

  superagent.get(url)
    .set({ 'Authorization': 'Bearer ' + key })
    .then(yelpResults => {
      const review = yelpResults.body.businesses.map(yelp => {
        let result = new Yelp(yelp);
        return result;
      })
      response.send(review)
    }).catch(error => handleError(error, response))
}

//Database Functions

function searchDatabase(dbSql) {

  let condition = '';
  let values = [];

  if (dbSql.searchQuery) {
    condition = 'search_query';
    values = [dbSql.searchQuery];
  } else {
    condition = 'id';
    values = [dbSql.id];
  }

  let sql = `SELECT * FROM ${dbSql.endpoint} WHERE ${condition}=$1;`;
  return client.query(sql, values);
}

function saveToDatabase(dbSql) {

  let safeValues = [];

  for (let i = 1; i <= dbSql.values.length; i++) {
    safeValues.push(`$${i}`);
  }

  let sqlValues = safeValues.join();
  let sql = '';

  if (dbSql.searchQuery) sql = `INSERT INTO ${dbSql.endpoint} (${dbSql.columns}) VALUES (${sqlValues}) RETURNING ID;`;
  else sql = `INSERT INTO ${dbSql.endpoint} (${dbSql.columns}) VALUES (${sqlValues});`;
  return client.query(sql, dbSql.values);
}


//Basic error handling

function handleError(err, response) {
  console.log(err);
  if (response) response.status(500).send('Sorry something went wrong');
}

app.get('*', (error, response) => {
  response.status(500).send('Sorry, the server is having a moment...');
})


//Turn it on and turn it up, connecting to our database and then turning on our port, two birds, one code.

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Lookin good on PORT ${PORT}!`)
    })
  })