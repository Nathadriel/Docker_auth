const express = require("express");
const { articles, nextArticleId } = require("../store");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Toutes les routes ci-dessous exigent une session valide
router.use(requireAuth);

// Un utilisateur authentifié ne doit voir que SES articles : le contrôle
// d'accès se fait à chaque requête, pas seulement à la connexion.
router.get("/", (req, res) => {
  const mine = articles
    .filter((a) => a.userId === req.session.userId)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(mine);
});

router.post("/", (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Titre et contenu requis." });
  }

  const article = {
    id: nextArticleId(),
    userId: req.session.userId,
    title,
    content,
    createdAt: new Date(),
  };
  articles.push(article);
  res.status(201).json(article);
});

module.exports = router;
