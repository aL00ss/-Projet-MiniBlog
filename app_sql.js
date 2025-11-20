const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session'); 
const app = express();
const port = 8100;
const cors = require('cors');


// Connection Ã  la base de données
var connection = mysql.createConnection({
    host: '192.168.4.1',
    user: 'sqlabesnier',
    password: '***REMOVED***',
    database: 'abesnier_blog',
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
function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.render('login', { error: null });
    }
    next();
}
// --- session middleware (ajouté) ---
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

// === FONCTIONS MYSQL ===

// get tous les articles
function getAllArticles() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM articles';
        
        connection.query(query, (error, results) => {
            if (error) {
                console.error(' Erreur getAllArticles:', error);
                reject(error);
            } else {
                console.log(` ${results.length} articles récupérés`);
                resolve(results);
            }
        });
    });
}

// get un article par ID
function getArticleById(id) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM articles WHERE id = ?';
        
        connection.query(query, [id], (error, results) => {
            if (error) {
                console.error(' Erreur getArticleById:', error);
                reject(error);
            } else if (results.length === 0) {
                resolve(null);
            } else {
                console.log(` Article ${id} récupérés`);
                resolve(results[0]);
            }
        });
    });
}

// get les commentaires d'un article
function getCommentsByid(id) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM comments WHERE article_id = ?';
        
        connection.query(query, [id], (error, results) => {
            if (error) {
                console.error(' Erreur getCommentsByid:', error);
                reject(error);
            } else {
                console.log(` ${results.length} commentaires récupérés pour l'article ${id}`);
                resolve(results);
            }
        });
    });
}

// create un nouvel article
function createArticle(title, content, author) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO articles (title, content, author) VALUES (?, ?, ?)';
        
        connection.query(query, [title, content, author], (error, results) => {
            if (error) {
                console.error(' Erreur createArticle:', error);
                reject(error);
            } else {
                console.log(` Article créé avec l'ID: ${results.insertId}`);
                resolve(results.insertId);
            }
        });
    });
}

// add un commentaire
function addComment(id, author, content) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO comments (article_id, author, content) VALUES (?, ?, ?)';
        
        connection.query(query, [id, author, content], (error, results) => {
            if (error) {
                console.error(' Erreur addComment:', error);
                reject(error);
            } else {
                console.log(` Commentaire ajouté avec l'ID: ${results.insertId}`);
                resolve(results.insertId);
            }
        });
    });
}

// === ROUTES ===

// Page d'accueil - Liste des articles
app.get('/', requireLogin,async (req, res) => {
    try {
        const articles = await getAllArticles();
        res.render('index', { 
            title: 'Mon Blog MySQL',
            articles: articles 
        });
    } catch (error) {
        console.error(' Erreur route /:', error);
        res.status(500).send('Erreur lors du chargement des articles');
    }
});

// Page d'un article avec ses commentaires
app.get('/article/:id', requireLogin, async (req, res) => {
    try {
        const id = req.params.id;
        const articles = await getArticleById(id);
        
        if (!articles) {
            return res.status(404).send('Article non trouvé');
        }
        
        const comments = await getCommentsByid(id);
        
        res.render('article', { 
            title: articles.title,
            articles: articles,
            comments: comments
        });
    } catch (error) {
        console.error(' Erreur route /article/:id:', error);
        res.status(500).send('Erreur lors du chargement de l\'article');
    }
});

// Formulaire de création d'article
app.get('/new', requireLogin, (req, res) => {
    res.render('new', { 
        title: 'Nouvel Article' 
    });
});

// create un nouvel article
app.post('/articles', requireLogin, async (req, res) => {
    try {
        const { title, content, author } = req.body;
        
        if (!title || !content || !author) {
            return res.status(400).send('Tous les champs sont obligatoires');
        }
        
        const id = await createArticle(title, content, author);
        res.redirect(`/article/${id}`);
    } catch (error) {
        console.error(' Erreur route POST /articles:', error);
        res.status(500).send('Erreur lors de la création de l\'article');
    }
});

// add un commentaire
app.post('/article/:id/comment', requireLogin, async (req, res) => {
    try {
        const id = req.params.id;
        const { author, content } = req.body;
        
        if (!author || !content) {
            return res.status(400).send('Tous les champs sont obligatoires');
        }
        
        await addComment(id, author, content);
        res.redirect(`/article/${id}`);
    } catch (error) {
        console.error(' Erreur route POST /article/:id/comment:', error);
        res.status(500).send('Erreur lors de l\'ajout du commentaire');
    }
});


// Page d'accueil -> page de connexion
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/articles');
    res.render('login', { error: null });
});

function createUser(username, hashedPassword) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
        connection.query(query, [username, hashedPassword], (error, results) => {
            if (error) {
                console.error(' Erreur createUser:', error);
                reject(error);
            } else {
                console.log(` Utilisateur créé avec l'ID: ${results.insertId}`);
                resolve(results.insertId);
            }
        });
    });
}


// route login (POST) 
app.post('/login', (req, res) => {
    const username = (req.body.username || '').toString();
    const password = (req.body.password || '').toString();

    if (!username || !password) {
        return res.render('login', { error: 'Veuillez renseigner tous les champs.' });
    }

    const sql = 'SELECT id, username, password FROM users WHERE username = ? LIMIT 1';
    connection.query(sql, [username], function(err, results) {
        if (err) {
            console.error('Erreur DB /login:', err);
            return res.render('login', { error: 'Erreur serveur.' });
        }
        if (results.length === 0) {
            return res.render('login', { error: 'Utilisateur introuvable.' });
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (bcryptErr, match) => {
            if (bcryptErr) {
                console.error('Erreur bcrypt.compare:', bcryptErr);
                return res.render('login', { error: 'Erreur serveur.' });
            }
            if (!match) {
                return res.render('login', { error: 'Mot de passe incorrect.' });
            }

            // authentifié
            req.session.user = { id: user.id, username: user.username };
            res.redirect('/');
        });
    });
});




app.post('/register', async (req, res) => {
    try {
        const { username, password, password2 } = req.body;
        if (!username || !password || !password2) {
            return res.render('login', { error: 'Tous les champs sont obligatoires.' });
        }
        if (password !== password2) {
            return res.render('login', { error: 'Les mots de passe ne correspondent pas.' });
        }

        // vérifier si l'utilisateur existe déjà
        connection.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username], async (err, results) => {
            if (err) {
                console.error('Erreur DB /register:', err);
                return res.render('login', { error: 'Erreur serveur.' });
            }
            if (results.length > 0) {
                return res.render('login', { error: 'Nom d\'utilisateur déjà pris.' });
            }

            // hacher le mot de passe et créer l'utilisateur
            const hash = await bcrypt.hash(password, 10);
            const newUserId = await createUser(username, hash);

            // connexion automatique après inscription
            req.session.user = { id: newUserId, username };
            res.redirect('/');
        });
    } catch (error) {
        console.error('Erreur route POST /register:', error);
        res.render('login', { error: 'Erreur lors de la création du compte.' });
    }
});


// logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        res.redirect('/');
    });
});

// start du serveur
app.listen(port, () => {
    console.log(`Serveur lancé sur le port: http://localhost:${port}`);
});




//api
app.get('/api/articles', (req, res) => {
    const query = 'SELECT * FROM articles';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des articles:', error);
            return res.status(500).json({ error: 'Erreur serveur.' });
        }
        res.json(results);
    });
});
