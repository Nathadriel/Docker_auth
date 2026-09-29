const app = document.getElementById("app");

async function api(path, options = {}) {
  const res = await fetch("/api" + path, {
    credentials: "include", // indispensable pour que le cookie de session parte avec chaque requête
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erreur");
  return data;
}

function renderLogin() {
  app.innerHTML = `
    <div class="card">
      <h2>Connexion</h2>
      <form id="login-form">
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Mot de passe (8 caractères minimum)" required minlength="8">
        <button type="submit">Se connecter</button>
      </form>
      <p class="error" id="login-error"></p>
      <a href="#" id="go-register">Créer un compte</a>
    </div>
  `;
  document.getElementById("go-register").onclick = (e) => {
    e.preventDefault();
    renderRegister();
  };
  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.target));
    try {
      await api("/login", { method: "POST", body: JSON.stringify({ email, password }) });
      renderDashboard();
    } catch (err) {
      document.getElementById("login-error").textContent = err.message;
    }
  };
}

function renderRegister() {
  app.innerHTML = `
    <div class="card">
      <h2>Inscription</h2>
      <form id="register-form">
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Mot de passe (8 caractères minimum)" required minlength="8">
        <button type="submit">Créer le compte</button>
      </form>
      <p class="error" id="register-error"></p>
      <a href="#" id="go-login">J'ai déjà un compte</a>
    </div>
  `;
  document.getElementById("go-login").onclick = (e) => {
    e.preventDefault();
    renderLogin();
  };
  document.getElementById("register-form").onsubmit = async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.target));
    try {
      await api("/register", { method: "POST", body: JSON.stringify({ email, password }) });
      renderLogin();
    } catch (err) {
      document.getElementById("register-error").textContent = err.message;
    }
  };
}

async function renderDashboard() {
  let me;
  try {
    me = await api("/me");
  } catch {
    return renderLogin();
  }

  app.innerHTML = `
    <div class="card">
      <div class="dash-header">
        <div>
          <p><strong>Bienvenue, ${me.email}</strong></p>
          <small>Votre session est protégée par un cookie HttpOnly.</small>
        </div>
        <button id="logout">Se déconnecter</button>
      </div>
      <form id="article-form">
        <input type="text" name="title" placeholder="Titre" required>
        <textarea name="content" placeholder="Contenu" required></textarea>
        <button type="submit">Publier</button>
      </form>
      <h3>Articles</h3>
      <div id="articles"></div>
    </div>
  `;

  document.getElementById("logout").onclick = async () => {
    await api("/logout", { method: "POST" });
    renderLogin();
  };

  document.getElementById("article-form").onsubmit = async (e) => {
    e.preventDefault();
    const { title, content } = Object.fromEntries(new FormData(e.target));
    await api("/articles", { method: "POST", body: JSON.stringify({ title, content }) });
    e.target.reset();
    loadArticles();
  };

  loadArticles();
}

async function loadArticles() {
  const list = document.getElementById("articles");
  const articles = await api("/articles");
  list.innerHTML =
    articles
      .map(
        (a) => `
    <div class="article">
      <strong>${a.title}</strong>
      <p>${a.content}</p>
      <small>${new Date(a.createdAt).toLocaleString()}</small>
    </div>
  `
      )
      .join("") || "<p>Aucun article pour le moment.</p>";
}

// Au chargement de la page : si une session valide existe déjà (cookie),
// l'utilisateur reste connecté après un rafraîchissement.
renderDashboard();
