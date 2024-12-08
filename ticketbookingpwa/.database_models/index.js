const { Sequelize } = require("sequelize");

// initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite", // specify the path to your SQLite database file
});

// test connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully!");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// export Sequelize instance for use in other database tables
module.exports = sequelize;
