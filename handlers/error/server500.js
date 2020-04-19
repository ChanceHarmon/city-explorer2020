'use strict';

const express = require('express');

const app = express();

const cors = require('cors');

app.use(cors());

module.exports = function handleError(err, response) {
  console.log(err);
  if (response) response.status(500).send('Sorry something went wrong');
}

