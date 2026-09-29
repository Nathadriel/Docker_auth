const express = require("express");
const bcrypt = require("bcrypt");
const { users, nextUserId } = require("../store");

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/register : hachage bcrypt du mot de passe, création de l'utilisateur
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
  }
  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
  }

  // Règle absolue : jamais de mot de passe en clair, jamais de chiffrement
  // réversible — uniquement un hachage à sens unique, salé automatiquement.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  users.push({ id: nextUserId(), email, passwordHash });

  res.status(201).json({ message: "Compte créé avec succès." });
});

// POST /api/login : vérification par bcrypt.compare, création d'une session
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  // On re-hache et on compare, on ne "déchiffre" jamais un mot de passe
  const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!isValid) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  }

  // La session est un état conservé côté serveur ; le client ne reçoit
  // qu'un identifiant opaque (cookie de session), jamais l'identité brute.
  req.session.userId = user.id;
  req.session.email = user.email;

  res.json({ message: "Connexion réussie.", email: user.email });
});

// GET /api/me : route protégée, accessible uniquement si la session est valide
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Non authentifié." });
  }
  res.json({ email: req.session.email });
});

// POST /api/logout : destruction de la session côté serveur
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Déconnecté." });
  });
});

module.exports = router;
