// required dependcies for the website
const express = require("express"); //requires express to be installed
const bodyParser = require("body-parser"); //requires body-parser to be installed
const session = require("express-session"); //requires express-session to be stalled
const bcrypt = require("bcrypt"); //requires bcrypt to be installed for hashing in db
const sequelize = require("./.database_models/index"); //requires sequelize for different db functions
const User = require("./.database_models/user.js"); //requires user.js database model to collect/store data
const Event = require("./.database_models/event.js"); //requires event.js database model to collect/store data
const Booking = require("./.database_models/booking.js"); //requires booking.js database model to collect/store data

const app = express(); //using express to run the app
app.use(express.static("public")); // show files from public

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false,
  })
);

app.set("view engine", "ejs"); //using ejs templates with html so scripts work within

// checking if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

//sync database with pages and make sure it's connected
sequelize.sync().then(() => {
  console.log("Database synchronized");
});

//!! ROUTES & POST FOR PAGES !!

//index page
app.get("/", async (req, res) => {
  res.render("index");
});

//events page
app.get("/events", async (req, res) => {
  const searchQuery = req.query.search || ""; //search bar query
  const events = await Event.findAll(); //generate events from db
  const filteredEvents = events.filter(
    (
      event //if search bar is not empty then search db for events
    ) => event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  let userBookings = []; //display if event already been booked by user
  if (req.session.user) {
    userBookings = await Booking.findAll({
      //find the booking by the user
      where: { userId: req.session.user.id },
      include: Event,
    });
  }
  res.render("events", {
    //render the events page with the following elements
    events: filteredEvents,
    searchQuery,
    user: req.session.user,
    userBookings,
  });
});

//signup page
app.get("/signup", (req, res) => res.render("signup"));

//signup form submission
app.post("/signup", async (req, res) => {
  const { email, name, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    //if password fields match
    return res.send("Passwords do not match"); //if passwords dont match
  }
  const hashedPassword = await bcrypt.hash(password, 10); //hash password with bcrypt
  try {
    await User.create({ email, password: hashedPassword, name }); //create new row in user table database
    return res.redirect("/login"); //if signup successful, go to log in page
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      //if emails are already registered, added to make sure the app doesn't crash
      return res.redirect("/signup-error"); //goes to signup-error if emails already registiered
    }
    console.error(error);
    return res.send("An unexpected error occurred during signup."); //if error occurs
  }
});

//login page
app.get("/login", (req, res) => res.render("login"));

//login page form
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } }); //finding the user's email in the db
  if (user && (await bcrypt.compare(password, user.password))) {
    //comparing db details to submitted details
    req.session.user = user;
    res.redirect("/events"); //if login successful then redirect to events page
  } else {
    res.redirect("/login-error"); //if password or email wrong
  }
});

//logout route
app.get("/logout", (req, res) => {
  req.session.destroy(); //end session, logging users out
  res.redirect("/login"); //route users to login page when btn clicked
});

//booking tickets submision
app.post("/book/:id", isAuthenticated, async (req, res) => {
  const eventId = req.params.id; //following three variables are to get the eventid,seats and user session
  const seats = parseInt(req.body.seats);
  const user = req.session.user;

  const event = await Event.findByPk(eventId); //find event in db by eventID
  if (event && event.seats >= seats) {
    //if seats are enough
    event.seats -= seats; //reduce number of event seats availabel by number of seats booked
    await event.save(); //save event's new amount of seats
    await Booking.create({ userId: user.id, eventId: event.id, seats: seats }); //create new row in booking table with userid, eventid and amt of seats
    res.redirect(`/thanku/${event.id}/${seats}`); //after seats are booked, redirect to thank u page
  } else {
    res.send("Not enough seats available."); //error message if seats not available
  }
});

//thank u page
app.get("/thanku/:eventId/:seats", (req, res) => {
  const { eventId, seats } = req.params; // get evenid and amount of seats to display
  Event.findByPk(eventId) //find event id to display
    .then((event) => {
      if (event) {
        //if event in db
        res.render("thanku", { event, seats }); //render the page with event name and amount of seats
      }
    })
    .catch((err) => {
      //error handling
      console.error(err);
      res.send("Error processing your request.");
    });
});

app.listen(443, () => console.log("server is running on http://localhost:443")); // server is run on port 443

// Sample data to db when mr hinton marks
async function seedEvents() {
  const eventsCount = await Event.count();
  if (eventsCount === 0) {
    //when there are no events already in the database
    await Event.bulkCreate([
      //create events when db is clear
      { name: "Event 1", seats: 100 },
      { name: "Event 2", seats: 150 },
      { name: "Event 3", seats: 80 },
      { name: "Event 4", seats: 60 },
    ]);
    console.log("Sample events added to the database.");
  }
}

// sync database with step above and add data from above function to seedEvents
sequelize.sync().then(async () => {
  console.log("Database synchronized");
  await seedEvents(); //run function for seeding events
});

// signup error page
app.get("/signup-error", (req, res) => {
  res.render("signup-error"); // render the signup-error page
});

// login error page
app.get("/login-error", (req, res) => {
  res.render("login-error"); //render the login-error page
});

// contact us page
app.get("/contact", (req, res) => {
  res.render("contact"); // render the contact page
});

// About us page
app.get("/aboutus", (req, res) => {
  res.render("aboutus"); // render the contact page
});
