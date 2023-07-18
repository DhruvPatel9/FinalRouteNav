//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/UserDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.redirect("/login");
  // res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});
app.get("/details", function(req, res){
  if (req.isAuthenticated()){
    res.render("detailsform");
  } else {
    res.redirect("/login");
  }
}
);

app.get("/dashboard", function(req, res){
  if (req.isAuthenticated()){
    res.render("dashboard");
  } else {
    res.redirect("/login");
  }
});

// Create a schema for the Employee collection
const EmployeeSchema = new mongoose.Schema({
  employee_id: { type: String, unique: true },
  name: String,
  home_location: String,
  shift_opted: String,
  preferences: {
    leaves: Boolean,
    work_from_home: Boolean
  },
  cab_id: String,
  driver_id: String
});

// Create a model based on the schema
const Employee = mongoose.model('Employee', EmployeeSchema);

// Create a schema for the Drivers collection
const DriverSchema = new mongoose.Schema({
  driver_id: { type: String, unique: true },
  name: String,
  contact_number: String,
  route: String,
  cab_id: String
});

// Create a model based on the schema
const Driver = mongoose.model('Driver', DriverSchema);

// Create a schema for the Cabs collection
const CabSchema = new mongoose.Schema({
  cab_id: { type: String, unique: true },
  number_plate: String,
  capacity: Number,
  garage_location: String
});

// Create a model based on the schema
const Cab = mongoose.model('Cab', CabSchema);

// Create a schema for the Holidays collection
const HolidaySchema = new mongoose.Schema({
  holiday_id: { type: String, unique: true },
  date: Date,
  description: String
});

// Create a model based on the schema
const Holiday = mongoose.model('Holiday', HolidaySchema);

// Create a schema for the Co-Employees collection
const CoEmployeeSchema = new mongoose.Schema({
  employee_id: { type: String, unique: true },
  co_employees: [{
    employee_id: { type: String, unique: true },
    name: String
  }]
});

// Create a model based on the schema
const CoEmployee = mongoose.model('CoEmployee', CoEmployeeSchema);

app.post('/employees', (req, res) => {
  if (req.isAuthenticated()) {
    const employee = new Employee({
      employee_id: req.body.employee_id,
      name: req.body.name,
      home_location: req.body.home_location,
      shift_opted: req.body.shift_opted,
      preferences: {
        leaves: req.body.leaves === 'on',
        work_from_home: req.body.work_from_home === 'on'
      },
      cab_id: req.body.cab_id,
      driver_id: req.body.driver_id
    });

    employee.save()
      .then(() => {
        console.log('Employee saved successfully');
        res.redirect('/dashboard');
      })
      .catch(error => {
        console.log('Error saving employee:', error);
        res.redirect('/details');
      });
  } else {
    res.redirect('/login');
  }
});

// Handle form submission for Driver
app.post('/drivers', (req, res) => {
  if (req.isAuthenticated()) {
    const driver = new Driver({
      driver_id: req.body.driver_id,
      name: req.body.name,
      contact_number: req.body.contact_number,
      route: req.body.route,
      cab_id: req.body.cab_id
    });

    driver.save()
      .then(() => {
        console.log('Driver saved successfully');
        res.redirect('/dashboard');
      })
      .catch(error => {
        console.log('Error saving driver:', error);
        res.redirect('/details');
      });
  } else {
    res.redirect('/login');
  }
});

// Handle form submission for Cab
app.post('/cabs', (req, res) => {
  if (req.isAuthenticated()) {
    const cab = new Cab({
      cab_id: req.body.cab_id,
      number_plate: req.body.number_plate,
      capacity: req.body.capacity,
      garage_location: req.body.garage_location
    });

    cab.save()
      .then(() => {
        console.log('Cab saved successfully');
        res.redirect('/dashboard');
      })
      .catch(error => {
        console.log('Error saving cab:', error);
        res.redirect('/details');
      });
  } else {
    res.redirect('/login');
  }
});

// Handle form submission for Holiday
app.post('/holidays', (req, res) => {
  if (req.isAuthenticated()) {
    const holiday = new Holiday({
      holiday_id: req.body.holiday_id,
      date: req.body.date,
      description: req.body.description
    });

    holiday.save()
      .then(() => {
        console.log('Holiday saved successfully');
        res.redirect('/dashboard');
      })
      .catch(error => {
        console.log('Error saving holiday:', error);
        res.redirect('/details');
      });
  } else {
    res.redirect('/login');
  }
});

// Handle form submission for Co-Employee
app.post('/coemployees', (req, res) => {
  if (req.isAuthenticated()) {
    const coEmployee = new CoEmployee({
      employee_id: req.body.employee_id,
      co_employees: req.body.co_employees
    });

    coEmployee.save()
      .then(() => {
        console.log('Co-Employee saved successfully');
        res.redirect('/dashboard');
      })
      .catch(error => {
        console.log('Error saving co-employee:', error);
        res.redirect('/details');
      });
  } else {
    res.redirect('/login');
  }
});



app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/dashboard");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/dashboard");
      });
    }
  });

});







app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
