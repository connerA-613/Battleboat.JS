// Imports
const express = require('express')
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc, updateDoc, query, where } = require('firebase/firestore');
const session = require('express-session')
const flash = require('connect-flash');
const app = express();
const port = 8080;
const bodyParser = require('body-parser');
// const reload = require('reload');

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))
app.use(flash());

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAYI9omx1vyptzPXhuMCHIdEune4HwmZ2o",
  authDomain: "battleboat-bc249.firebaseapp.com",
  projectId: "battleboat-bc249",
  storageBucket: "battleboat-bc249.appspot.com",
  messagingSenderId: "631904862372",
  appId: "1:631904862372:web:f528ac89ff90d6428b6631",
  measurementId: "G-288VF0547K"
};

const app1 = initializeApp(firebaseConfig);
const db = getFirestore(app1);
let isLoggedVar = false;
let logFlag = false;

//funtion that retives all user information from database
async function getUser(db, email, password) {
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where("email", "==", email), where("password", "==", password))
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
    let user = doc.data();
  });
  return;
}


/* function will return add user to the db
 return false if user exit
 return truer if user signed up succeccfully */
async function setUser(db, username, email, password) {

  signUpStatus = false;

  //checking if user already exist
  const usersCol = collection(db, 'users');
  const userQuery = await getDocs(query(usersCol, where('username', '==', username)));
  if (!userQuery.empty) {
    console.log('Username already exists'); // replace it with a pop up alert or view
    signUpStatus = false;
    return false;
  }

  // adding the user to the db
  await setDoc(doc(db, 'users', username), {
    username: username,
    email: email,
    password: password,
    accuracy: 0,
    win_percentage: 0,
    win_streak: 0,
    games_won: 0,
    total_shots: 0,
    total_hits: 0,
    games_played: 0,
    hq_won: 0,
    hq_games_played: 0
  });

  // log the user in right after they sign up
  let user = getUser(db, email, password);
  signUpStatus = true;
  return signUpStatus;
}


app.use(bodyParser.urlencoded({ extended: false }));

// POST route for the login form
app.post('/login/submit', async (req, res) => {
  const email = req.body.email;
  const password = req.body.pswd;
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where("email", "==", email), where("password", "==", password))
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty){
    querySnapshot.forEach((doc) => {
    let newUser = doc.data();
    req.session.user = newUser;
    });
    //req.session.user = user
    logFlag = true;
    req.session.isLoggedVar = true;
    res.redirect('/');
    console.log(req.session);
  }else{
    req.session.isLoggedVar = false;
    logFlag = true;
    req.flash('message', 'unable to log in.');
    res.redirect('/login');
  }
});

app.post('/signup/submit', async (req, res) => {
  const email = req.body.email;
  const password = req.body.pswd;
  const username = req.body.txt;
  const usersCol = collection(db, 'users');
  console.log(`Email: ${email}, Password: ${password}, Username: ${username}`);
  signUpStatus = await setUser(db, username, email, password);
  console.log(signUpStatus);
  // Add your code to authenticate the user and add them to the database here

  if (signUpStatus) {
    const q = query(usersCol, where("email", "==", email), where("password", "==", password))
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      let newUser = doc.data();
      req.session.user = newUser;
    });
    req.session.isLoggedVar = true;
    res.redirect('/');
  }else{
    req.session.isLoggedVar = false;
    logFlag = false;
    req.flash('message', 'unable to sign up.');
    res.redirect('/login');
  }
});


// Static Files
app.use(express.static('public'));
// Specific folder example
// app.use('/css', express.static(dirname + 'public/css'))
app.use('/js', express.static(__dirname + '/public/js'));
// app.use('/img', express.static(dirname + 'public/images'))

// Set View's
app.set('views', './views');
app.set('view engine', 'ejs');
// Navigation
app.get('/', (req, res) => {
  logged = false;
  if (typeof req.session.isLoggedVar === 'undefined') {
    logged = false;
  } else {
    logged = req.session.isLoggedVar;
  }
  res.render('index', { isLogged: logged, user: {} })
})

app.get('/login', (req, res) => {
  logged = false;
  if (typeof req.session.isLoggedVar === 'undefined') {
    logged = false;
  } else {
    logged = req.session.isLoggedVar;
  }
  res.render('accountForm', { logFlag: true, user: {}, message: req.flash('message') })
})

app.get('/signup', (req, res) => {
  logged = false;
  if (typeof req.session.isLoggedVar === 'undefined') {
    logged = false;
    console.log("its false")
  } else {
    logged = req.session.isLoggedVar;
  }
  res.render('accountForm', { logFlag: false, user: {}, message: req.flash('message') })
})

app.get('/account', async (req, res) => {
  // console.log(req.session.user)
  // update the user variable
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where("email", "==", req.session.user.email), where("password", "==", req.session.user.password))
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty){
    querySnapshot.forEach((doc) => {
    // console.log(doc.id, " => ", doc.data());
    req.session.user = doc.data();
    });
  }
  res.render('userAccount', { isLogged: req.session.isLoggedVar, user: req.session.user })
})

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('index', { isLogged: false, user: {} })
})

app.get('/logout', (req, res) => {
  isLoggedVar = false;
  user = {};
  res.redirect("/");
})

app.use(express.json())

// async function updateStats(db, username)

app.post('/', async (req, res) => {

  const {stats} = req.body
  console.log(stats)

  // get current logged in user
  cur_user = req.session.user

  // if not logged in then dont do anything
  if (cur_user === undefined) {

  } else {
    
    console.log(cur_user.username)

    totalHits = cur_user.total_hits += stats.shotsHit
    totalShots = cur_user.total_shots += stats.shotsTaken
    gamesPlayed = cur_user.games_played += stats.gamesPlayed
    gamesWon = cur_user.games_won += stats.gamesWon

    acc = Math.round( (totalHits/totalShots) * 100) / 100
    winp = Math.round( (gamesWon/gamesPlayed) * 100) / 100

    hqWon = cur_user.hq_won += stats.hqWon
    hqGames = cur_user.hq_games_played += stats.hqGames

    // update current user stats
    // need to add onto data, updateDoc will replace fields
    await updateDoc(doc(db, 'users', cur_user.username), {
      
      total_hits: totalHits,
      total_shots: totalShots,
      games_played: gamesPlayed,
      games_won: gamesWon,

      accuracy: acc,
      win_percentage: winp,

      win_streak: 0,

      hq_won: hqWon,
      hq_games_played: hqGames,
    })


  }

})

app.listen(port, () => console.info(`App listening on port ${port}`))