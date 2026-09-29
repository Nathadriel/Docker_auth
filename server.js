const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/auth");
const articleRoutes = require("./routes/articles");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // inaccessible en JavaScript côté client
      secure: process.env.NODE_ENV === "production", // HTTPS uniquement en prod
      sameSite: "lax", // limite l'envoi lors de requêtes cross-site
      maxAge: 1000 * 60 * 60 * 2, // 2 heures
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", authRoutes);
app.use("/api/articles", articleRoutes);

app.listen(PORT, () => {
  console.log(`SecureBlog en écoute sur le port ${PORT}`);
});
