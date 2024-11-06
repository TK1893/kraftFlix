// passport.js  //////////////

/**
 * @file passport.js - Configures authentication strategies using Passport.js
 * @requires passport - Middleware for user authentication
 * @requires passport-local - Strategy for authenticating with a username and password
 * @requires passport-jwt - Strategy for authenticating with a JSON Web Token (JWT)
 * @requires models.js - User model for accessing the MongoDB collection
 */

// IMPORTS   (of required Libraries and Models)  //////////////

const passport = require('passport'); // Passport library for authentication
const LocalStrategy = require('passport-local').Strategy; // Local strategy for username/password authentication
const Models = require('./models.js'); // Importing database models
const passportJWT = require('passport-jwt'); // JWT strategy for token-based authentication

// VARIABLES   (PASSPORT & MODELS)  //////////////

let Users = Models.User; // User model for querying user data
let JWTStrategy = passportJWT.Strategy; // JWT strategy for verifying tokens
let ExtractJWT = passportJWT.ExtractJwt; // Extracts JWT from the request

// LOCAL-STRATEGY  //////////////
/**
 * Defines and configures the local strategy for username/password authentication.
 * @strategy LocalStrategy
 * @param {Object} options - Configuration options for the LocalStrategy
 * @param {string} options.usernameField - Field in request containing the username
 * @param {string} options.passwordField - Field in request containing the password
 * @param {function} verify - Callback function to handle username/password verification
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'Username', // Specifies the field name in the request for username
      passwordField: 'Password', // Specifies the field name in the request for password
    },
    // ASYNC  //////////////
    /**
     * Verifies the provided username and password.
     * @async
     * @function
     * @param {string} username - Entered username
     * @param {string} password - Entered password
     * @param {function} callback - Callback function to pass back success/failure results
     * @returns {Promise} - Resolves with user object if successful, otherwise false
     */
    async (username, password, callback) => {
      console.log(`${username} ${password}`); // Debugging output of entered username/password

      // Finds the user by username in the database
      await Users.findOne({ Username: username })
        .then((user) => {
          if (!user) {
            // If user is not found, authentication fails
            console.log('incorrect username');
            return callback(null, false, {
              message: 'Incorrect username or password', // Message sent to client
            });
          }

          // Validates the provided password against the stored hashed password
          if (!user.validatePassword(password)) {
            //Hashing user password at login
            console.log('incorrect password');
            return callback(null, false, { message: 'Incorrect password.' });
          }

          // Successful authentication; passes user data to the next middleware
          console.log('authentication successful');
          return callback(null, user);
        })

        // Error handling in case of database issues
        .catch((error) => {
          if (error) {
            console.log(error);
            return callback(error);
          }
        });
    }
  )
);

// JWT-STRATEGY  //////////////
/**
 * Defines and configures the JWT strategy for authenticating requests with a token.
 * @strategy JWTStrategy
 * @param {Object} options - Configuration options for the JWTStrategy
 * @param {function} verify - Callback function to verify the JWT and retrieve user data
 */
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(), // Extracts JWT from the request's Authorization header
      secretOrKey: 'your_jwt_secret', // Secret key used to verify the token's signature
    },

    // ASYNC  //////////////
    /**
     * Verifies the JWT payload and retrieves the associated user.
     * @async
     * @function
     * @param {Object} jwtPayload - Decoded JWT payload containing user data
     * @param {function} callback - Callback function to pass back success/failure results
     * @returns {Promise} - Resolves with user object if found, otherwise error
     */
    async (jwtPayload, callback) => {
      // Finds the user by ID from the decoded JWT payload
      return await Users.findById(jwtPayload._id)
        .then((user) => {
          // Passes user data to the next middleware if found
          return callback(null, user);
        })
        .catch((error) => {
          // Handles any errors that occur during the database lookup
          return callback(error);
        });
    }
  )
);
