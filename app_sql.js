const express = require('express');
const path = require('path');
const mysql = require('mysql');

const app = express();
const port = 3000;

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
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

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
app.get('/', async (req, res) => {
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
app.get('/article/:id', async (req, res) => {
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
app.get('/new', (req, res) => {
    res.render('new', { 
        title: 'Nouvel Article' 
    });
});

// create un nouvel article
app.post('/articles', async (req, res) => {
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
app.post('/article/:id/comment', async (req, res) => {
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

// start du serveur
app.listen(port, () => {
    console.log(` Serveur démarré sur http://localhost:${port}`);
});
