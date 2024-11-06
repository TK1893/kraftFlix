// index.js  //////////////

/**
 * @file index.js - Main file for the movie API built with Node.js and Express
 * @requires express
 * @requires body-parser
 * @requires uuid
 * @requires morgan
 * @requires fs
 * @requires path
 * @requires mongoose
 * @requires cors
 * @requires passport
 * @requires ./auth
 * @requires ./passport
 * @requires ./models
 */

// CORE MODULES AND THIRD-PARTY LIBRARIES (IMPORTS)  ////////////
const express = require('express'); // Express framework
const bodyParser = require('body-parser'); // To parse JSON bodies
const uuid = require('uuid'); // For generating unique IDs
const morgan = require('morgan'); // HTTP request logger middleware
const fs = require('fs'); // File system module for logging
const path = require('path'); // Path utilities
const cors = require('cors'); // For enabling CORS
const mongoose = require('mongoose'); // Mongoose package - MongoDB ORM

// DATABASE MODELS IMPORT  ////////////
const Models = require('./models.js'); // Mongoose models

// EXPRESS APP INITIALIZATION  ////////////
const app = express();

// ASSIGNING MODELS TO VARIABLES ////////////
const Movies = Models.Movie; // Access Movie model from models.js
const Users = Models.User;

// BODY-PARSER MIDDLEWARE  //////////////
/**
 * Middleware for parsing JSON request bodies
 * @type {Function}
 */
app.use(bodyParser.json()); // Middleware for parsing JSON data in request bodies

// ALLOWED ORIGIN FOR CORS  //////////////
/**
 * @constant
 * @type {Array<string>}
 * @description List of allowed origins for CORS policy
 */
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
  'https://tk1893.github.io/Angular-client-kraftflix',
  'https://tk1893.github.io/Angular-client-kraftflix/welcome',
];

// CORS MIDDLEWARE SETUP  //////////////
/**
 * @description CORS middleware setup
 */
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

// AUTHENTICATION & PASSPORT SETUP  //////////////
let auth = require('./auth')(app); // Importing authentication logic
const passport = require('passport'); // For user authentication
require('./passport'); // Importing passport strategies

// MONGOOSE CONNECTION TO DATABASE  //////////////
/**
 * @description Establish a connection to the MongoDB database.
 * @see ConnectionURI should be defined in environment variables.
 */
mongoose.connect(process.env.ConnectionURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// SERVER-SIDE-INPUT-VALIDATION   (with Express Validator Library)  //////////////
const { check, validationResult } = require('express-validator');

// LOGGER-SETUP  (using Morgan Middleware)  //////////////
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});
app.use(morgan('combined', { stream: accessLogStream }));

// STATIC-DOCUMENTATION  //////////////
/**
 * @description Serves static documentation files at /documentation endpoint (from the "public" directory)
 */
app.use(
  '/documentation',
  express.static('public', { index: 'documentation.html' })
);

// USER-REGISTRATION  //////////////
/**
 * @name POST /users
 * @description Registers a new user
 * @function
 * @memberof module:routes/users
 * @param {string} Username - The username of the user
 * @param {string} Password - The user's password (hashed)
 * @param {string} Email - The user's email address
 * @param {Date} Birthday - The user's birthdate
 * @returns {object} 201 - Newly created user object
 * @returns {object} 400 - User already exists
 * @returns {object} 422 - Validation error
 */
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

// ADD-TO-FAVORITES  //////////////
/**
 * Add a movie to a user's favorite list.
 * @name POST /users/:Username/movies/:MovieID
 * @function
 * @memberof module:routes/users
 * @param {string} req.params.Username - The user's username
 * @param {string} req.params.MovieID - The movie ID to add
 * @returns {string} - Confirmation message with updated favorite movies
 * @throws {Error} - If user is not found or other error occurs
 */
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

// GET-WELCOME  //////////////
/**
 * Welcome message at the root endpoint.
 * @name GET /
 * @function
 * @returns {string} - Welcome message
 */
app.get('/', (req, res) => {
  res.send('Welcome to my kraftFlix app!');
});

// GET-ALL-USERS  //////////////
/**
 * Get all users.
 * @name GET /users
 * @function
 * @memberof module:routes/users
 * @returns {Object[]} - Array of user objects
 * @throws {Error} - If retrieval fails
 */
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

// GET-SINGLE-USER  (by Username)  //////////////
/**
 * @function GET /users/:Username
 * @description Retrieves data about a user by username
 * @param {string} Username - The username of the user
 * @returns {object} - User data object
 */
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

// GET-ALL-MOVIES  //////////////
/**
 * @function GET /movies
 * @description Retrieves a list of all movies
 * @returns {array} - List of all movie objects
 */
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

// GET-SINGLE-MOVIE   (by title)  //////////////
/**
 * @function GET /movies/:Title
 * @description Retrieves data about a single movie by title
 * @param {string} Title - The title of the movie
 * @returns {object} - Movie data object
 */
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

// GET-DIRECTOR   (by name)  //////////////
/**
 * @function GET /movies/directors/:directorName
 * @description Gets information about director by by its name
 */
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

// GET-GENRE   (by name)  //////////////
/**
 * @function GET /movies/genres/:genreName
 * @description Gets information about director by by its name
 */
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

// UPDATE USER  //////////////
/**
 * Update a user's data by username.
 * @name PUT /users/:Username
 * @function
 * @memberof module:routes/users
 * @param {string} req.params.Username - The username of the user to update
 * @param {Object} req.body - The updated user data
 * @returns {Object} - Updated user object
 * @throws {Error} - If user is not found or other error occurs
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

// DELETE-FAVORITE-MOVIE  //////////////
/**
 * @function DELETE /users/:Username/movies/:MovieID
 * @description Removes a movie from the user's list of favorite movies
 * @param {string} Username - The username of the user
 * @param {string} MovieID - The ID of the movie to remove
 * @returns {object} - Updated user data object with the remaining favorite movies
 */
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

// DELETE-USER  (by Username)  //////////////
/**
 * Delete a user by username.
 * @name DELETE /users/:Username
 * @function
 * @memberof module:routes/users
 * @param {string} req.params.Username - The username of the user to delete
 * @returns {string} - Confirmation message
 * @throws {Error} - If user is not found or other error occurs
 */
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

// ERROR-HANDLING (with Express) //////////////
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// START-SERVER  //////////////
/**
 * Start the server and listen for incoming requests on a specified port.
 * @description Initializes the server on a specified port, either from an environment variable or defaulting to 8080.
 * @constant
 * @type {number}
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
