// auth.js  //////////////

/**
 * @file auth.js - Defines and handles user authentication and JWT token generation for login.
 * @requires passport - Middleware for authentication
 * @requires jsonwebtoken - Library for generating JWT tokens
 * @requires passport-local - Local authentication strategy
 */

// AUTHENTICATION CONFIGURATION  //////////////
const jwtSecret = 'your_jwt_secret'; // Secret key for signing JWT tokens; should match JWTStrategy config in passport.js

// EXTERNAL MODULES  //////////////
const jwt = require('jsonwebtoken'); // JSON Web Token library for creating and verifying tokens
const passport = require('passport'); // Passport library for managing authentication

// LOCAL IMPORT  //////////////
require('./passport'); // Imports local passport configuration to enable authentication strategies

// GENERATE-JWT-TOKEN  //////////////
/**
 * Generates a JSON Web Token (JWT) for the authenticated user.
 * The token includes the user's information and has an expiration time.
 *
 * @function generateJWTToken
 * @param {Object} user - The user object to be encoded in the token.
 * @returns {string} JWT token - Signed JWT containing user details.
 */
let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // Username is set as the subject of the token
    expiresIn: '7d', // Token expiration time (7 days)
    algorithm: 'HS256', // Algorithm used to hash the token data (HS256 is HMAC with SHA-256)
  });
};

// EXPORT-AUTHENTICATION SETUP  //////////////
/**
 * @function module.exports - Exports the authentication setup to handle user login.
 * @param {Object} router - Express router object to define routes.
 * @description Defines a POST route for user login.
 * When a POST request is made to `/login`, it authenticates the user using Passport's LocalStrategy.
 * If successful, it generates a JWT for the user and returns it in the response.
 */
module.exports = (router) => {
  /**
   * POST - API endpoint for user login
   * @name POST/login
   * @function
   * @inner
   * @param {Object} req - Express request object, containing the user's login credentials.
   * @param {Object} res - Express response object, used to send back the JWT or error message.
   * @returns {Object} JSON - Contains the user data and a signed JWT on successful login.
   * @example
   * // Request body
   * {
   *    "Username": "exampleUser",
   *    "Password": "password123"
   * }
   * // Response (on successful login)
   * {
   *    "user": { ...user details... },
   *    "token": "jwt.token.here"
   * }
   */
  router.post('/login', (req, res) => {
    // Authenticates user credentials using Passport's 'local' strategy
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        // Returns a 400 status if authentication fails (incorrect credentials or other error)
        return res.status(400).json({
          message: 'Something is not right',
          user: user, // `user` will be null here if authentication failed
        });
      }
      // If authentication succeeds, log the user in without creating a session
      req.login(user, { session: false }, (error) => {
        if (error) {
          // If login fails, send the error message
          res.send(error);
        }

        // Generate a JWT token for the logged-in user
        let token = generateJWTToken(user.toJSON());
        // Return JSON containing the user object and the JWT token
        return res.json({ user, token });
      });
    })(req, res); // Passes `req` and `res` to `passport.authenticate` as a middleware function
  });
};
