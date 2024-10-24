const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(bodyParser.json()); // To read body information

// CORS Integration
const cors = require('cors');
let allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:8080',
  'http://localhost:1234',
  'http://localhost:3000',
  'http://testsite.com',
  'https://kraftflix-89566322872a.herokuapp.com/',
  'https://2f7sjs.csb.app/',
  'https://kraftflix.netlify.app',
  'https://tk1893.github.io/Kraftflix-React',
]; // Defining list of allowed domains
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a origin isn’t found on the list of allowed origins
        let message = `The CORS policy for this application does not allow access from origin 
          ${origin}`;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

let auth = require('./auth')(app); // To import Authentication Logic defined in auth.js
const passport = require('passport'); // to require passport Module
require('./passport'); // To import passport.js

// Integration von Mongoose in die REST-API
const mongoose = require('mongoose'); // Mongoose package
const Models = require('./models.js'); // Mongoose-Models definded in models.js
const Movies = Models.Movie; // Model name defined in models.js
const Users = Models.User; // Model name defined in models.js

// Connection to HEROKU DATABASE - allows Mongoose to connect to db (to perform CRUD operations on the containing documents)
mongoose.connect(process.env.ConnectionURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Server-Side Validation with Express Validator Library
const { check, validationResult } = require('express-validator');
// createWriteStream() = fs function fo create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});
// setup the logger ( using Morgan Middleware)
app.use(morgan('combined', { stream: accessLogStream }));
// Express method that mounts middleware functions to a specific path.

// ****************************************************************************************************
// DOCUMENTATION Endpoint
app.use(
  '/documentation',
  express.static('public', { index: 'documentation.html' })
  // { index: 'documentation.html' } = options object. It specifies that when a directory is requested,
  // Express should look for a file named "documentation.html" in that directory(public) and serve it as the default index file
);

// *****************************************************************************************************
// CREATE / POST requests
// *****************************************************************************************************

// REGISTER NEW USER
// We’ll expect JSON in this format
// { ID: Integer, Username: String, Password: String, Email: String, Birthday: Date }

app.post(
  '/users',
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
  ],
  async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    // Hashing User Password when registering
    let hashedPassword = Users.hashPassword(req.body.Password);
    // Search to check if a user with the requested username already exists
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthdate: req.body.Birthdate,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// ADD MOVIE to FavoriteMovies
app.post(
  '/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { Username, MovieID } = req.params;
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send('Permission denied');
    }
    Users.findOne({ Username })
      .then((user) => {
        if (!user) {
          return res.status(404).send('User not found');
        }
        return Users.findOneAndUpdate(
          { Username },
          { $addToSet: { FavoriteMovies: MovieID } },
          { new: true }
        );
      })
      .then((updatedUser) => {
        res
          .status(200)
          .send(
            `New Favorite Movie ${MovieID} was added. \n Updated Favorite Movies of ${updatedUser.Username}:\n[ ${updatedUser.FavoriteMovies} ]`
          );
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// *****************************************************************************************************
// READ / GET requests
// *****************************************************************************************************
// HOME
app.get('/', (req, res) => {
  res.send('Welcome to my kraftFlix app!');
});

// All USERS
app.get(
  '/users',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// USER by USERNAME
app.get(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// All MOVIES
app.get(
  '/movies',
  // passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })

      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// MOVIE by TITLE
app.get(
  '/movies/:Title',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send('Error: ' + err);
      });
  }
);

// DIRECTOR by NAME
app.get(
  '/movies/directors/:directorName',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Movies.findOne({ 'Director.Name': req.params.directorName })
      .then((movies) => {
        res.json(movies.Director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// GENRE by NAME
app.get(
  '/movies/genres/:genreName',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Movies.findOne({ 'Genre.Name': req.params.genreName })
      .then((movies) => {
        res.json(movies.Genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// *****************************************************************************************************
// Update / PUT requests
// *****************************************************************************************************

// UPDATE USER DATA by USERNAME
// expect JSON in this format
/* 
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}
*/
app.put(
  '/users/:Username',
  [
    // Input validation
    check('Username', 'Username is required').isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
    passport.authenticate('jwt', { session: false }),
  ],
  async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    // Check if the authenticated user is the same as the user being updated
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send('Permission denied');
    }
    // Update the user data with hashed password
    const hashedPassword = Users.hashPassword(req.body.Password); // Hash the password again
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword, // Use the hashed password
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        // Promise
        res.json(updatedUser);
      })
      .catch((err) => {
        // Error Handling
        console.error(err);
        res.status(500).send('Error:' + err);
      });
  }
);

// Add a movie to a user's list of favorites
app.post(
  '/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { username: req.params.Username },
      {
        $push: { favoriteMovies: req.params.MovieID },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// *****************************************************************************************************
// DELETE / DELETE requests
// *****************************************************************************************************
// DELETE MOVIE from FavoriteMovies
app.delete(
  '/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { Username, MovieID } = req.params;
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send('Permission denied');
    }
    Users.findOne({ Username })
      .then((user) => {
        if (!user) {
          return res.status(404).send('User not found');
        }
        return Users.findOneAndUpdate(
          { Username },
          { $pull: { FavoriteMovies: MovieID } },
          { new: true }
        );
      })
      .then((updatedUser) => {
        res
          .status(200)
          .send(
            `Favorite Movie ${MovieID} was deleted. \n Updated Favorite Movies of ${updatedUser.Username}:\n[ ${updatedUser.FavoriteMovies} ]`
          );
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// DELETE USER by USERNAME
app.delete(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send('Permission denied');
    }
    await Users.findOneAndDelete({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);
// *******************************************************************************************************
// Error Handling with Express
// *******************************************************************************************************
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
