const WHATSAPP_PHONE = ""; 
// Set the store WhatsApp number in international format, e.g. "919876543210".

let catalogProducts = [];
let activeCategory = "All";

document.addEventListener("DOMContentLoaded", initCatalog);

async function initCatalog() {
  renderAuthAction();
  bindCatalogEvents();
  await loadCatalog();
}

function bindCatalogEvents() {
  const categoryBar = document.getElementById("categoryBar");
  if (categoryBar) {
    categoryBar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      setCategory(button.dataset.category);
    });
  }

  const authAction = document.getElementById("authAction");
  if (authAction) {
    authAction.addEventListener("click", handleAuthAction);
  }
}

async function loadCatalog() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  if (!window.ZayaSupabase?.isConfigured) {
    grid.innerHTML = `
      <div class="state-card">
        <strong>Store configuration required</strong>
        <p>Add the Supabase URL and publishable key in <code>js/supabase.js</code>.</p>
      </div>`;
    return;
  }

  grid.innerHTML = `<div class="state-card"><span class="loader"></span><p>Curating the collection…</p></div>`;

  const { data, error } = await supabaseClient
    .from("products")
    .select("id, token, title, category, price, mrp, colors, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = `
      <div class="state-card">
        <strong>Unable to load the collection</strong>
        <p>${escapeHtml(error.message)}</p>
      </div>`;
    return;
  }

  catalogProducts = Array.isArray(data) ? data : [];
  buildCategoryBar();
  renderProducts();
}

function buildCategoryBar() {
  const categories = [
    "All",
    ...new Set(
      catalogProducts
        .map((product) => String(product.category || "").trim())
        .filter(Boolean)
    )
  ];

  const bar = document.getElementById("categoryBar");
  if (!bar) return;

  bar.innerHTML = categories
    .map(
      (category) => `
      <button class="category-pill ${category === activeCategory ? "active" : ""}"
              type="button"
              data-category="${escapeHtml(category)}">
        ${escapeHtml(category)}
      </button>`
    )
    .join("");
}

function setCategory(category) {
  activeCategory = category;
  buildCategoryBar();
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const visible =
    activeCategory === "All"
      ? catalogProducts
      : catalogProducts.filter(
          (product) =>
            String(product.category || "").toLowerCase() ===
            activeCategory.toLowerCase()
        );

  if (!visible.length) {
    grid.innerHTML = `
      <div class="state-card">
        <strong>No pieces in this collection yet.</strong>
        <p>Check another category or add products from the admin portal.</p>
      </div>`;
    return;
  }

  grid.innerHTML = visible.map(renderProductCard).join("");
}

function renderProductCard(product) {
  const first = getFirstVariant(product);
  const image = first?.image || "";
  const discount = calculateDiscount(product.price, product.mrp);
  const href = getProductUrl(product, first?.name);

  return `
    <article class="product-card">
      <a class="product-image-link" href="${escapeHtml(href)}" aria-label="View ${escapeHtml(product.title)}">
        <div class="product-image-wrap">
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)}" loading="lazy" decoding="async">`
              : `<div class="image-placeholder">ZAYA</div>`
          }
          ${discount ? `<span class="product-badge">${discount}% OFF</span>` : ""}
        </div>
      </a>

      <div class="product-card-body">
        <div class="product-category">${escapeHtml(product.category || "Collection")}</div>
        <h2 class="product-title">${escapeHtml(product.title)}</h2>

        <div class="price-row">
          <strong>${formatINR(product.price)}</strong>
          ${
            Number(product.mrp) > Number(product.price)
              ? `<span class="mrp">${formatINR(product.mrp)}</span>`
              : ""
          }
        </div>

        <div class="swatch-row" aria-label="Available colors">
          ${(Array.isArray(product.colors) ? product.colors : [])
            .slice(0, 5)
            .map(
              (color) =>
                `<span class="mini-swatch" title="${escapeHtml(color.name)}"
                       style="background:${escapeHtml(color.hex || "#ddd")}"></span>`
            )
            .join("")}
        </div>

        <a class="card-link" href="${escapeHtml(href)}">View piece <span>→</span></a>
      </div>
    </article>`;
}

async function renderAuthAction() {
  const button = document.getElementById("authAction");
  if (!button || !window.ZayaSupabase?.isConfigured) return;

  const { data } = await supabaseClient.auth.getSession();
  const user = data?.session?.user;

  button.textContent = user ? "Sign Out" : "Sign In";
  button.dataset.authenticated = user ? "true" : "false";
}

async function handleAuthAction(event) {
  event.preventDefault();
  if (!window.ZayaSupabase?.isConfigured) {
    window.location.href = "/auth.html";
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  if (data?.session) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    await renderAuthAction();
    return;
  }

  window.location.href = "/auth.html";
}

window.addEventListener("pageshow", renderAuthAction);