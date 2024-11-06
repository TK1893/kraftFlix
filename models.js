// models.js

/**
 * @file models.js - Defines the Mongoose schemas and models for movies and users in the application.
 * @requires mongoose - Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js
 * @requires bcrypt - bcrypt is used for hashing and comparing passwords securely
 */

const mongoose = require('mongoose'); // Import Mongoose library
const bcrypt = require('bcrypt'); // Import bcrypt library for password hashing

// MOVIE-SCHEMA  //////////////////////
/**
 * Movie Schema for the database collection `Movies`
 * @typedef {Object} MovieSchema
 * @property {string} Title - Title of the movie, required
 * @property {string} Description - Description of the movie, required
 * @property {Object} Genre - Genre information
 * @property {string} Genre.Name - Name of the genre
 * @property {string} Genre.Description - Description of the genre
 * @property {Object} Director - Director information
 * @property {string} Director.Name - Director's name
 * @property {string} Director.Bio - Director's biography
 * @property {string[]} Actors - Array of actor names in the movie
 * @property {string} ImageUrl - URL for the movie's image/poster
 * @property {boolean} Featured - Boolean flag if the movie is a featured movie
 */
let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Director: {
    Name: String,
    Bio: String,
  },
  Actors: [String],
  ImageUrl: String,
  Featured: Boolean,
});

// USERS-SCHEMA  //////////////////////
/**
 * User Schema for the database collection `Users`
 * @typedef {Object} UserSchema
 * @property {string} Username - User's unique username, required
 * @property {string} Password - User's hashed password, required
 * @property {string} Email - User's email address, required
 * @property {Date} Birthdate - User's birthdate
 * @property {ObjectId[]} FavoriteMovies - Array of references to favorite movies (Movie IDs)
 */
let userSchema = mongoose.Schema({
  Username: { type: String, required: true }, // is a required string
  Password: { type: String, required: true }, // is a required string, will be hashed
  Email: { type: String, required: true }, // is a required string
  Birthdate: Date, // is an optional date field
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }], // Array of ObjectIDs referencing Movie model
});

// HASH PASSWORD  //////////////////////
/**
 * Hashes a user's password.
 * @function hashPassword
 * @memberof UserSchema
 * @param {string} password - Plaintext password entered by the user
 * @returns {string} - Hashed password for secure storage
 */
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10); // Synchronously generates a hash with a salt round of 10
};

// VALIDATE PASSWORD  //////////////////////
/**
 * Validates a user's password by comparing it to the stored hashed password.
 * @method validatePassword
 * @memberof UserSchema
 * @param {string} password - Plaintext password entered by the user
 * @returns {boolean} - True if the password matches the stored hash, false otherwise
 */
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.Password);
};

// CREATING MODELS FROM SCHEMAS (MOVIE & USER)  //////////////////////
/**
 * Creates a Movie model based on the movieSchema
 * @type {Model<MovieSchema>}
 */
let Movie = mongoose.model('Movie', movieSchema);

/**
 * Creates a User model based on the userSchema
 * @type {Model<UserSchema>}
 */
let User = mongoose.model('User', userSchema);

// EXPORTING MODELS (MOVIE & USER)  //////////////////////
module.exports.Movie = Movie;
module.exports.User = User;
