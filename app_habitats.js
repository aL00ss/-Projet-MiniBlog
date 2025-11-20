const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session'); 
const app = express();
const port = 8100;
const cors = require('cors');


// Connection
var connection = mysql.createConnection({
    host: '192.168.4.1',
    user: 'sqlabesnier',
    password: '***REMOVED***',
    database: 'abesnier_bdEval',
    ssl: {
        rejectUnauthorized: false
    }
});

connection.connect(function(err){
    if(err) throw err;
    console.log("Connection à la base de données MySQL!");
});

// Middlewares
app.use(cors({ origin: 'http://localhost:8100' }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- session middleware  ---
app.use(session({
    name: 'sessionId',
    secret: '***REMOVED***',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 60 * 1000,
        httpOnly: true,
        secure: false
    }
}));


// start du serveur
app.listen(port, () => {
    console.log(`Serveur lancé sur le port: http://localhost:${port}/listechefdesecteur`);
});


//api listechefdesecteur
app.get('/listechefdesecteur', (req, res) => {
    const query = 'SELECT * FROM users where type=1';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des users:', error);
            return res.status(500).json({ error: 'Erreur serveur.' });
        }
        res.json(results);
    });
});

//api listechefdesventes/:idChefSecteur
app.get('/listechefdesventes/:idchefdesecteur', (req, res) => {
    const query = 'SELECT * FROM users where type=2 and idchefdesecteur='+req.params.idchefdesecteur;
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des users:', error);
            return res.status(500).json({ error: 'Erreur serveur.' });
        }
        res.json(results);
    });
});

//api /listecommerciaux/:idChefVentes
app.get('/listecommerciaux/:idchefdesventes', (req, res) => {
    const query = 'SELECT * FROM users where type=3 and idchefdesventes='+req.params.idchefdesventes;
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des users:', error);
            return res.status(500).json({ error: 'Erreur serveur.' });
        }
        res.json(results);
    });
});