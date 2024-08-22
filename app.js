require('dotenv').config();

const express = require('express');// also to host a application locally
const expressLayout = require('express-ejs-layouts');
const dbconnection = require('./server/config/db');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');

dbconnection();

const app = express();// allowing the app to rin the express function
const PORT = process.env.PORT || 3000 ;// PORTS t


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

app.use(express.static('public'));
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use('/', require('./server/routes/main'));

//hosting part
app.listen(PORT, ()=> {
    console.log(`Hosting Scout it on PORT: ${PORT}`);
});

