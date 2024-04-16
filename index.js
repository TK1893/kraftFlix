const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

const app = express();
app.use(bodyParser.json()); // To read body information

let users = [
  {
    id: 1,
    name: 'Jojo Muster',
    email: 'j.muster@gmail.com',
    favoriteMovies: ['In The Mood for Love', 'The Man Without a Past'],
  },
  {
    id: 2,
    name: 'Tobsen Muster',
    email: 't.muster@gmail.com',
    favoriteMovies: ['Dead Man'],
  },
];

// create Movie Database
let movies = [
  {
    Title: 'Dead Man',
    'Release-year': 1995,
    Director: {
      Name: 'Jim Jarmusch',
      Birth: 1953,
      Death: '-',
      Bio: 'Moved to New York City at the age of seventeen from Akron, Ohio. Graduated from Columbia University with a B.A. in English, class of 1975. Without any prior film experience, he was accepted into the Tisch School of the Arts, New York.',
    },
    Genre: {
      Name: 'Western',
      Description:
        'Should contain numerous scenes and/or a narrative where the portrayal is similar to that of frontier life in the American West during 1600s to contemporary times.',
    },
  },
  {
    Title: 'In the Mood for Love',
    'Release-year': 1995,
    Director: {
      Name: 'Wong Kar-Wai',
      Birth: 1956,
      Death: '-',
      Bio: `Wong Kar-wai (born 17 July 1956) is a Hong Kong Second Wave filmmaker, internationally renowned as an auteur for his visually unique, highly stylised, emotionally resonant work, including Ah fei zing zyun (1990), Dung che sai duk (1994), Chung Hing sam lam (1994), Do lok tin si (1995), Chun gwong cha sit (1997), 2046 (2004) and My Blueberry Nights (2007), Yi dai zong shi (2013). His film Fa yeung nin wa (2000), starring Maggie Cheung and Tony Leung, garnered widespread critical acclaim. Wong's films frequently feature protagonists who yearn for romance in the midst of a knowingly brief life and scenes that can often be described as sketchy, digressive, exhilarating, and containing vivid imagery. Wong was the first Chinese director to win the Best Director Award of Cannes Film Festival (for his work Chun gwong cha sit in 1997). Wong was the President of the Jury at the 2006 Cannes Film Festival, which makes him the only Chinese person to preside over the jury at the Cannes Film Festival. He was also the President of the Jury at the 63rd Berlin International Film Festival in February 2013. In 2006, Wong accepted the National Order of the Legion of Honour: Knight (Highest Degree) from the French Government. In 2013, Wong accepted Order of Arts and Letters: Commander (Highest Degree) by the French Minister of Culture.`,
    },
    Genre: {
      Name: 'Drama',
      Description:
        'Should contain numerous consecutive scenes of characters portrayed to effect a serious narrative throughout the title, usually involving conflicts and emotions. This can be exaggerated upon to produce melodrama. Subjective.',
    },
  },
  {
    Title: 'The Man Without a Past',
    'Release-year': 2002,
    Director: {
      Name: 'Aki Kaurismäki',
      Birth: 1957,
      Death: '-',
      Bio: `Aki Kaurismäki did a wide variety of jobs including postman, dish-washer and film critic, before forming a production and distribution company, Villealfa (in homage to Jean-Luc Godard's Alphaville (1965)) with his older brother Mika Kaurismäki, also a film-maker. Both Aki and Mika are prolific film-makers, and together have been responsible for one-fifth of the total output of the Finnish film industry since the early 1980s, though Aki's work has found more favour abroad. His films are very short (he says a film should never run longer than 90 minutes, and many of his films are nearer 70), eccentric parodies of various genres (road movies, film noir, rock musicals), populated by lugubrious hard-drinking Finns and set to eclectic soundtracks, typically based around '50s rock'n'roll.`,
    },
    Genre: {
      Name: 'Drama',
      Description:
        'Should contain numerous consecutive scenes of characters portrayed to effect a serious narrative throughout the title, usually involving conflicts and emotions. This can be exaggerated upon to produce melodrama. Subjective.',
    },
  },
  {
    Title: 'A Clockwork Orange',
    Director: 'Stanley Kubrick',
  },
  {
    Title: 'The Big Lebowski',
    Director: 'Joel Coen & Ethan Coen',
  },
  {
    Title: "Adam's Apples",
    Director: 'Joel Coen & Ethan Coen',
  },
  {
    Title: '2046',
    Director: 'Kar-Wai Wong',
  },
  {
    Title: 'Down by Law',
    Director: 'Jim Jarmusch',
  },
  {
    Title: 'The Wolf of Wall Street',
    Director: 'Martin Scorsese',
  },
  {
    Title: 'Another Round',
    Director: 'Thomas Vinterberg',
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

// *****************************************************************************************************
// CREATE / POST requests
// *****************************************************************************************************
// Create new user
app.post('/users', (req, res) => {
  const newUser = req.body;
  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send('user needs name');
  }
});

// Create Favorite Movie List & Adding Title
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(
      `"${movieTitle}" has been added to ${
        user.name
      }'s favorite movies. \n Updated favorite movies array: 
        ${JSON.stringify(user.favoriteMovies)}.`
    );
  } else {
    res.status(400).send('could not update favorite movies');
  }
  console.log(JSON.stringify(user.favoriteMovies));
});

// *****************************************************************************************************
// READ / GET requests
// *****************************************************************************************************
// HOME
app.get('/', (req, res) => {
  res.send('Welcome to my kraftFlix app!');
});
// USERS LIST
app.get('/users', (req, res) => {
  res.status(200).json(users);
});
// MOVIE LIST
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
  console.log(__dirname);
});
// MOVIE by TITLE
app.get('/movies/:title', (req, res) => {
  // const title = req.params.title;
  const { title } = req.params; // Object destructuring andere Schreibweise von "const title = req.params.title;"
  const movie = movies.find((movie) => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('no such movie');
  }
});
// GENRE by NAME
app.get('/movies/genre/:genreName', (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find((movie) => movie.Genre.Name === genreName).Genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send('no such genre');
  }
});
// DIRECTOR by NAME
app.get('/movies/directors/:directorName', (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(
    (movie) => movie.Director.Name === directorName
  ).Director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('no such director');
  }
});
// *****************************************************************************************************
// Update / PUT requests
// *****************************************************************************************************

//Update user info
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user = {
      id: user.id,
      name: updatedUser.name,
      email: updatedUser.email,
      favoriteMovies: user.favoriteMovies,
    };
    res.status(200).json(user);
  } else {
    res.status(400).send('not a registered user');
  }
});

// *****************************************************************************************************
// DELETE / DELETE requests
// *****************************************************************************************************
// Delete Movie from Favorite Movies List
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);
  if (user) {
    userMovie = user.favoriteMovies.filter((title) => title !== movieTitle);
    res
      .status(200)
      .send(
        `"${movieTitle}" has been removed from ${user.name}'s favorite movies.`
      );
  } else {
    res.status(400).send('could not update favorite movies');
  }
  console.log(JSON.stringify(user.favoriteMovies));
});

//Delete a user
app.delete('/users/:id/', (req, res) => {
  const { id } = req.params;
  let user = users.find((user) => user.id == id);

  if (user) {
    users = users.filter((user) => user.id != id);
    console.log(users);
    res
      .status(200)
      .send(`User "${user.name}" (User-ID: ${user.id}) has been deleted`);
  } else {
    res.status(400).send('could not update user');
  }
});

// *******************************************************************************************************
// Error Handling with Express
// *******************************************************************************************************
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
