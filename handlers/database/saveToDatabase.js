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

module.exports = function saveToDatabase(dbSql) {

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

