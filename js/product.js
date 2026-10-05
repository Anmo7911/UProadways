let currentProduct = null;
let selectedVariant = null;

document.addEventListener("DOMContentLoaded", initProductPage);

async function initProductPage() {
  document.getElementById("backButton")?.addEventListener("click", () => {
    if (document.referrer && new URL(document.referrer).origin === location.origin) {
      history.back();
    } else {
      location.href = "/";
    }
  });

  document.getElementById("orderWhatsApp")?.addEventListener("click", orderOnWhatsApp);
  document.getElementById("authAction")?.addEventListener("click", handleProductAuth);

  const token = new URLSearchParams(location.search).get("token") || getTokenFromPath();
  if (!token) {
    showProductError("Product not found", "No product token was supplied.");
    return;
  }

  await loadProduct(token);
}

function getTokenFromPath() {
  const parts = location.pathname.split("/").filter(Boolean);
  return parts[0] === "product" ? decodeURIComponent(parts[1] || "") : "";
}

async function loadProduct(token) {
  if (!window.ZayaSupabase?.isConfigured) {
    showProductError(
      "Store configuration required",
      "Add your Supabase URL and publishable key in js/supabase.js."
    );
    return;
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("id, token, title, category, price, mrp, colors, created_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error(error);
    showProductError("Unable to load product", error.message);
    return;
  }

  if (!data) {
    showProductError("Piece not found", "The requested product may have been removed.");
    return;
  }

  currentProduct = data;

  const requestedColor = new URLSearchParams(location.search).get("color");
  selectedVariant =
    findVariantBySlug(data.colors, requestedColor) || getFirstVariant(data);

  renderProduct();
  syncUrl(false);
}

function findVariantBySlug(colors, requestedSlug) {
  if (!requestedSlug || !Array.isArray(colors)) return null;
  return (
    colors.find((variant) => slugify(variant.name) === slugify(requestedSlug)) || null
  );
}

function renderProduct() {
  if (!currentProduct) return;

  document.title = `${currentProduct.title} | ZAYA`;

  const image = document.getElementById("productImage");
  image.src = selectedVariant?.image || "";
  image.alt = `${currentProduct.title} — ${selectedVariant?.name || ""}`;

  document.getElementById("productTitle").textContent = currentProduct.title;
  document.getElementById("productCategory").textContent =
    currentProduct.category || "Collection";
  document.getElementById("productPrice").textContent =
    formatINR(currentProduct.price);

  const mrp = document.getElementById("productMrp");
  if (Number(currentProduct.mrp) > Number(currentProduct.price)) {
    mrp.textContent = formatINR(currentProduct.mrp);
    mrp.hidden = false;
  } else {
    mrp.hidden = true;
  }

  const discount = calculateDiscount(currentProduct.price, currentProduct.mrp);
  const discountEl = document.getElementById("productDiscount");
  discountEl.textContent = discount ? `${discount}% OFF` : "";
  discountEl.hidden = !discount;

  document.getElementById("selectedColor").textContent =
    selectedVariant?.name || "—";

  renderSwatches();
}

function renderSwatches() {
  const container = document.getElementById("colorSwatches");
  const colors = Array.isArray(currentProduct?.colors)
    ? currentProduct.colors
    : [];

  container.innerHTML = colors
    .map((variant) => {
      const selected =
        selectedVariant &&
        slugify(selectedVariant.name) === slugify(variant.name);

      return `
        <button
          class="color-swatch ${selected ? "selected" : ""}"
          type="button"
          aria-label="Select ${escapeHtml(variant.name)}"
          title="${escapeHtml(variant.name)}"
          data-color="${escapeHtml(variant.name)}"
          style="--swatch:${escapeHtml(variant.hex || "#ddd")};">
        </button>`;
    })
    .join("");

  container.querySelectorAll("[data-color]").forEach((button) => {
    button.addEventListener("click", () => selectColor(button.dataset.color));
  });
}

function selectColor(colorName) {
  const variant = (currentProduct.colors || []).find(
    (item) => slugify(item.name) === slugify(colorName)
  );

  if (!variant) return;
  selectedVariant = variant;
  renderProduct();
  syncUrl(true);
}

function syncUrl(push) {
  if (!currentProduct) return;

  const url = getProductUrl(currentProduct, selectedVariant?.name);
  const method = push ? "pushState" : "replaceState";
  history[method]({}, "", url);
}

window.addEventListener("popstate", async () => {
  const token = getTokenFromPath() || new URLSearchParams(location.search).get("token");
  if (token !== currentProduct?.token) {
    await loadProduct(token);
    return;
  }

  const color = new URLSearchParams(location.search).get("color");
  const variant = findVariantBySlug(currentProduct.colors, color);
  if (variant) {
    selectedVariant = variant;
    renderProduct();
  }
});

function buildWhatsAppUrl() {
  const phone = String(window.ZAYA_WHATSAPP_PHONE || "").replace(/\D/g, "");
  const text = [
    "Hello ZAYA, I would like to order this piece.",
    "",
    `Product: ${currentProduct.title}`,
    `Color: ${selectedVariant?.name || "Not selected"}`,
    `Price: ${formatINR(currentProduct.price)}`,
    `Product token: ${currentProduct.token}`,
    `Product link: ${location.origin}${getProductUrl(currentProduct, selectedVariant?.name)}`
  ].join("\n");

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function orderOnWhatsApp() {
  if (!currentProduct) return;
  window.open(buildWhatsAppUrl(), "_blank", "noopener,noreferrer");
}

async function handleProductAuth(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const { data } = await supabaseClient.auth.getSession();

  if (data?.session) {
    await supabaseClient.auth.signOut();
    button.textContent = "Sign In";
  } else {
    location.href = "/auth.html";
  }
}

function showProductError(title, message) {
  const state = document.getElementById("productState");
  const content = document.getElementById("productContent");
  content.hidden = true;
  state.hidden = false;
  state.innerHTML = `
    <div class="state-card">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
      <a class="primary-button" href="/">Back to ZAYA</a>
    </div>`;
}