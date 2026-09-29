// Route protégée : accessible uniquement si la session est valide
module.exports = function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  next();
};
