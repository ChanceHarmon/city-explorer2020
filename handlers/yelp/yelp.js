'use strict';


require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');
app.use(cors());

const superagent = require('superagent');
const handleError = require('../error/server500.js');

function Yelp(yelp) {
  this.name = yelp.name;
  this.image_url = yelp.image_url;
  this.price = yelp.price;
  this.rating = yelp.rating;
  this.url = yelp.url;
}

module.exports = function handleYelp(request, response) {

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