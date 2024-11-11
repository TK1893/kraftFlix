# Movie API (Kraftflix API)

This is a RESTful API application created with Node.js and Express that allows users to create and manage an account, browse a selection of movies, and save favorite movies to their profile. This API is protected by JWT-based authentication, and data is securely stored in a MongoDB database.

## Table of Contents

**1. Technologies and Packages**

**2. Project Structure**

**3. Authentication and Security**

**4. API Endpoints**

**5. Error Handling**

**6. CORS**

**7. Database**

**8. Deployment**

**9. How to Set Up**

**10. License**

**11. Author**

---

## Technologies and Packages

The following technologies and packages were used to build this API:

- **Node.js:**  
  JavaScript runtime environment for server-side applications.
- **Express:**
  Web framework for Node.js.
- MongoDB - NoSQL database.
- Mongoose - ODM (Object Data Modeling) library for MongoDB.
- Passport: Authentication middleware for Node.js.

- passport-local: Strategy for local username and password authentication.
- passport-jwt: Strategy for authenticating using JWT.

- bcrypt: Library for hashing passwords.
- jsonwebtoken: For creating and verifying JSON Web Tokens (JWTs).
- CORS: Cross-Origin Resource Sharing, enables restricted resources on a web page to be requested from another domain.
- Express Validator: Middleware for request data validation.
- Morgan: Logging middleware to capture requests.
- dotenv: For managing environment variables (e.g., MongoDB connection URI, JWT secrets).

---

## Project Structure

This project includes the following primary files and directories:

- index.js: Main application file, sets up the server, middleware, routes, and database connection.
- auth.js: Defines authentication logic and integrates Passport.js.
- models.js: Defines MongoDB schemas and models for movies and users.
- passport.js: Passport strategies for local authentication and JWT.
- public/: Static documentation resources, like documentation.html.
- log.txt: Log file for request information generated by morgan.

---

## Authentication and Security

This API uses JWT (JSON Web Tokens) to manage user sessions securely. Passport.js is configured with the following strategies:

- Local Strategy: Handles login requests by verifying the user’s username and password.
- JWT Strategy: Verifies the JWT on protected routes to ensure users have valid authentication.

Password hashing is done using bcrypt, ensuring user passwords are stored securely in the database.

---

## API Endpoints

Here are the primary API endpoints for this application:

### User Management

1. Register a New User  
   POST /users  
   Description: Registers a new user with the provided information.

Request body:  
{

"Username": "required, min 5 characters",

"Password": "required",

"Email": "required, must be a valid email",

"Birthday": "optional"

}

2. User Login  
   POST /login  
   Description: Authenticates the user and returns a JWT for access to protected routes.  
   Request body:  
   {

"Username": "required",

"Password": "required"

}

3. Get All Users  
   GET /users  
   Description: Retrieves a list of all registered users.  
   Protected: Yes, requires a valid JWT.

4. Get User by Username  
   GET /users/:Username  
   Description: Retrieves detailed information about a specific user by username.  
   Protected: Yes, requires a valid JWT.

5. Update User Information  
   PUT /users/:Username  
   Description: Updates the user’s details.

Protected: Yes, requires a valid JWT.  
Request body:  
{

"Username": "optional",

"Password": "optional",

"Email": "optional",

"Birthday": "optional"

}

6. Delete User  
   DELETE /users/:Username  
   Description: Removes a user from the database.  
   Protected: Yes, requires a valid JWT.

### Movies

1.  Get All Movies  
    GET /movies  
    Description: Retrieves a list of all movies in the database.  
    Protected: Yes, requires a valid JWT.
2.  Get Movie by Title  
    GET /movies/:Title  
    Description: Retrieves information about a specific movie by title.  
    Protected: Yes, requires a valid JWT.
3.  Get Genre Information  
    GET /movies/genres/:genreName  
    Description: Retrieves details about a specific genre.  
    Protected: Yes, requires a valid JWT.
4.  Get Director Information  
    GET /movies/directors/:directorName  
    Description: Retrieves information about a specific director.  
    Protected: Yes, requires a valid JWT.

### Favorite Movies

1.  Add Movie to Favorites  
    POST /users/:Username/movies/:MovieID  
    Description: Adds a movie to the user’s list of favorite movies.  
    Protected: Yes, requires a valid JWT.
2.  Remove Movie from Favorites  
    DELETE /users/:Username/movies/:MovieID  
    Description: Removes a movie from the user’s list of favorite movies.  
    Protected: Yes, requires a valid JWT.

---

## Error Handling

The API includes centralized error handling. Errors are managed through an Express middleware function:

app.use((err, req, res, next) => {

res.status(err.status || 500).json({

message: err.message || 'Internal Server Error',

error: err

});

});

This captures server errors, returning an appropriate status code and error message to the client. Validation errors, authentication issues, and database errors are handled specifically to improve user feedback.

---

### CORS

The API restricts access to specified origins. The allowed origins are defined in the allowedOrigins array:

let allowedOrigins = [

'http://localhost:4200',

'http://localhost:8080',

...

];

---

### Database

- MongoDB is used as the database to store user and movie data.

#### Mongoose Models

- Movie:

- Title: (String, required)
- Description: (String, required)
- Genre: (Object, with Name and Description)
- Director: (Object, with Name and Bio)
- Actors: (Array of Strings)
- ImageUrl: (String)
- Featured: (Boolean)

- User:

- Username: (String, required)
- Password: (String, required, stored as a hashed value)
- Email: (String, required)
- Birthdate: (Date)
- FavoriteMovies: (Array of Movie ObjectIds, references Movie model)

---

### Deployment

- The API is deployed to Heroku

---

## How to Set Up

### Prerequisites

- Node.js and npm installed.
- MongoDB database instance available.

### Steps to Install the Project

1. Clone the Repository:  
   git clone [https://github.com/TK1893/kraftFlix.git](https://github.com/TK1893/kraftFlix.git)

2. Open the Project Folder

cd movie_api

3. Install Dependencies  
   npm install

---

## License

This project is open-source under the MIT License.

---

## Author

Developed by Tobias Kraft as a part of an API development project for managing movie data and user information.
