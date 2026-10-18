module.exports = {
  "development": {
    "username": process.env.DB_USER || "postgres",
    "password": process.env.DB_PASSWORD || "postgres",
    "database": process.env.DB_NAME || "pet_care_dev",
    "host": process.env.DB_HOST || "127.0.0.1",
    "port": process.env.DB_PORT || 5432,
    "dialect": "postgres"
  },
  "test": {
    "username": process.env.DB_USER || "postgres",
    "password": process.env.DB_PASSWORD || "postgres",
    "database": process.env.DB_NAME_TEST || "pet_care_test",
    "host": process.env.DB_HOST || "127.0.0.1",
    "port": process.env.DB_PORT || 5432,
    "dialect": "postgres"
  },
  "production": {
    "username": process.env.DB_USER || "postgres",
    "password": process.env.DB_PASSWORD || "postgres",
    "database": process.env.DB_NAME || "pet_care_prod",
    "host": process.env.DB_HOST || "127.0.0.1",
    "port": process.env.DB_PORT || 5432,
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  }
}
