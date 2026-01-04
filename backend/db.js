const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",           // your PostgreSQL username
  host: "localhost",
  database: "web_app_db",     // your database name
  password: "Branko_0912",   // your PostgreSQL password
  port: 5432,                 // default port
});

module.exports = pool;
