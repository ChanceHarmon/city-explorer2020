'use strict';

require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');
app.use(cors());

const superagent = require('superagent');
const handleError = require('../error/server500.js');

function Movie(movie) {
  this.title = movie.original_title;
  this.overview = movie.overview.slice(0, 750);
  this.average_votes = movie.votes_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/original${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
}

module.exports = function handleMovies(request, response) {

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