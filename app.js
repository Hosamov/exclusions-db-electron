const express = require('express');

// Initialize DB:
require('./initDB')();

const app = express();

// Connect to local db:
mongoose.connect(`mongodb://localhost:27017/${process.env.DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Home GET route - redirects to login or homepage depending on authorization
app.get('/', (req, res, next) => {
  res.send('Root page');
});

app.get('/home', (req, res, next) => {
  res.send('Home page');
});

app.get('/home', (req, res, next) => {
  res.send('Home page');
});

// Login POST route
app.post('/login', (req, res, next) => {
  // Uses passport.js to authenticate user
});

app.listen(3000, () => {
  console.log('Listening on port 3000...');
});
