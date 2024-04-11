const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

const app = express();

// create Movie Database
let topMovies = [
  {
    title: 'Dead Man',
    director: 'Jim Jarmusch',
  },
  {
    title: 'A Clockwork Orange',
    director: 'Stanley Kubrick',
  },
  {
    title: 'The Man Without a Past',
    director: 'Aki Kaurismäki',
  },
  {
    title: 'The Big Lebowski',
    director: 'Joel Coen & Ethan Coen',
  },
  {
    title: "Adam's Apples",
    director: 'Joel Coen & Ethan Coen',
  },
  {
    title: 'In the Mood for Love',
    director: 'Kar-Wai Wong',
  },
  {
    title: '2046',
    director: 'Kar-Wai Wong',
  },
  {
    title: 'Down by Law',
    director: 'Jim Jarmusch',
  },
  {
    title: 'The Wolf of Wall Street',
    director: 'Martin Scorsese',
  },
  {
    title: 'Another Round',
    director: 'Thomas Vinterberg',
  },
];

// createWriteStream() = fs function fo create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});
// setup the logger ( using Morgan Middleware)
app.use(morgan('combined', { stream: accessLogStream }));
// app.use = Express method that mounts middleware functions to a specific path.

app.use(
  '/documentation',
  express.static('public', { index: 'documentation.html' })
  // { index: 'documentation.html' } = options object. It specifies that when a directory is requested,
  // Express should look for a file named "documentation.html" in that directory(public) and serve it as the default index file
);

// GET requests *************************************************************************
app.get('/', (req, res) => {
  res.send('Welcome to my kraftFlix app!');
});

app.get('/movies', (req, res) => {
  res.json(topMovies);
  console.log(__dirname);
});

// Error Handling with Express
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
