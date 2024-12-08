const { DataTypes } = require("sequelize");
const sequelize = require("./index"); // import sequelize instance
const Event = require("./event"); //import Event model
const User = require("./user"); // import User model

const Booking = sequelize.define("Booking", {
  seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Events",
      key: "id",
    },
  },
});

//relationships
Event.hasMany(Booking, { foreignKey: "eventId" }); // Event has many Bookings
Booking.belongsTo(Event, { foreignKey: "eventId" }); // Booking belongs to Event
User.hasMany(Booking, { foreignKey: "userId" }); // User has many Bookings
Booking.belongsTo(User, { foreignKey: "userId" }); // Booking belongs to User

module.exports = Booking;
