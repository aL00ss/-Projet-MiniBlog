const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;


app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


let articles = [];
const dataFile = path.join(__dirname, "data.json");

if (fs.existsSync(dataFile)) {
  articles = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}


app.get("/", (req, res) => {
  res.render("index", { articles });
});


app.get("/article/:id", (req, res) => {
  const article = articles.find(a => a.id == req.params.id);
  if (!article) return res.status(404).send("Article non trouvé");
  res.render("article", { article });
});


app.get("/new", (req, res) => {
  res.render("new");
});


app.post("/new", (req, res) => {
  const { title, content, img } = req.body;
  const newArticle = {
    id: Date.now(),
    title,
    content,
    img
  };
  articles.push(newArticle);
  fs.writeFileSync(dataFile, JSON.stringify(articles, null, 2));
  res.redirect("/");
});


app.get("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);


  articles = articles.filter(article => article.id !== id);


  fs.writeFileSync(dataFile, JSON.stringify(articles, null, 2));
    
  res.redirect("/");
});


app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
