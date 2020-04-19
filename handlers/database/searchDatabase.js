'use strict';

require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');
app.use(cors());

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

module.exports = function searchDatabase(dbSql) {

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

