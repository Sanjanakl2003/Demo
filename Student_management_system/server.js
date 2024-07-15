const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const nodemailer = require('nodemailer');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' directory

mongoose.connect('mongodb+srv://sanjana:sanjana@mario.i0p5k.mongodb.net/?retryWrites=true&w=majority&appName=mario', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB Atlas');
}).catch((err) => {
  console.error('Error connecting to MongoDB Atlas:', err);
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const studentSchema = new mongoose.Schema({
  name: String,
  age: String,
  userId: String,
});

const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb+srv://sanjana:sanjana@mario.i0p5k.mongodb.net/?retryWrites=true&w=majority&appName=mario '})
}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // Ensure the correct path
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      password: hashedPassword,
    });

    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.log(err);
    res.redirect('/register');
  }
});

app.post('/login', async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const foundUser = await User.findOne({ username: username });

    if (foundUser && await bcrypt.compare(password, foundUser.password)) {
      req.session.userId = foundUser._id;
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.log(err);
    res.redirect('/login');
  }
});

app.get('/dashboard', (req, res) => {
  if (req.session.userId) {
    res.sendFile(__dirname + '/public/dashboard.html');
  } else {
    res.redirect('/login');
  }
});

app.post('/add-student', async (req, res) => {
  if (req.session.userId) {
    try {
      const newStudent = new Student({
        name: req.body.name,
        age: req.body.age,
        userId: req.session.userId,
      });

      await newStudent.save();
      res.redirect('/dashboard');
    } catch (err) {
      console.log(err);
      res.redirect('/dashboard');
    }
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
