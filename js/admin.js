let currentAdminUser = null;

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  if (!window.ZayaSupabase?.isConfigured) {
    location.replace("/auth.html");
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data?.session) {
    location.replace("/auth.html");
    return;
  }

  currentAdminUser = data.session.user;

  // Defense-in-depth: verify the signed-in user exists in admin_users.
  // If you intentionally want every authenticated user to manage products,
  // remove this block and use the simpler authenticated-only RLS policy.
  const { data: adminRow, error: adminError } = await supabaseClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", currentAdminUser.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    await supabaseClient.auth.signOut();
    showAdminGate("This account is authenticated but is not authorized for the admin portal.");
    return;
  }

  document.getElementById("adminEmail").textContent =
    currentAdminUser.email || "Authenticated admin";

  document.getElementById("productForm")?.addEventListener("submit", handleProductSubmit);
  document.getElementById("signOutButton")?.addEventListener("click", signOutAdmin);
  document.getElementById("fileInput")?.addEventListener("change", previewImage);

  await loadAdminProducts();
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submit = document.getElementById("saveProductButton");
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    setAdminMessage("Select a product image.", "error");
    return;
  }

  const title = form.title.value.trim();
  const token = slugify(form.token.value);
  const category = form.category.value.trim();
  const price = Number(form.price.value);
  const mrp = Number(form.mrp.value);
  const colorName = form.colorName.value.trim();
  const colorHex = form.colorHex.value.trim();

  if (!title || !token || !category || !colorName || !colorHex) {
    setAdminMessage("Complete every product field.", "error");
    return;
  }

  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(mrp) || mrp < 0) {
    setAdminMessage("Price and MRP must be valid non-negative numbers.", "error");
    return;
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
    setAdminMessage("Color Hex Code must look like #A86B58.", "error");
    return;
  }

  submit.disabled = true;
  submit.textContent = "Uploading…";

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");

  const extension = safeName.includes(".")
    ? safeName.slice(safeName.lastIndexOf("."))
    : ".jpg";

  const path = `${token}/${crypto.randomUUID()}${extension}`;

  try {
    const { error: uploadError } = await supabaseClient.storage
      .from("product-images")
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type || "image/jpeg",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabaseClient.storage
      .from("product-images")
      .getPublicUrl(path);

    const imageUrl = publicData?.publicUrl;
    if (!imageUrl) throw new Error("Unable to create the public image URL.");

    const colors = [
      {
        name: colorName,
        hex: colorHex.toUpperCase(),
        image: imageUrl
      }
    ];

    const { error: insertError } = await supabaseClient
      .from("products")
      .insert({
        title,
        token,
        category,
        price,
        mrp,
        colors
      });

    if (insertError) {
      // The uploaded object can be cleaned up if the database insert fails.
      await supabaseClient.storage.from("product-images").remove([path]);
      throw insertError;
    }

    form.reset();
    document.getElementById("imagePreview").hidden = true;
    setAdminMessage("Product published successfully.", "success");
    await loadAdminProducts();
  } catch (error) {
    console.error(error);
    setAdminMessage(error.message || "Could not publish product.", "error");
  } finally {
    submit.disabled = false;
    submit.textContent = "Publish product";
  }
}

async function loadAdminProducts() {
  const list = document.getElementById("adminProductList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("products")
    .select("id, title, token, category, price, mrp, colors, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="state-card"><strong>${escapeHtml(error.message)}</strong></div>`;
    return;
  }

  list.innerHTML = (data || [])
    .map((product) => {
      const first = getFirstVariant(product);
      return `
        <article class="admin-product-row">
          <img src="${escapeHtml(first?.image || "")}" alt="" loading="lazy">
          <div>
            <strong>${escapeHtml(product.title)}</strong>
            <span>${escapeHtml(product.category)} · ${formatINR(product.price)}</span>
            <small>${escapeHtml(product.token)}</small>
          </div>
          <a href="${escapeHtml(getProductUrl(product, first?.name))}" target="_blank" rel="noopener">View</a>
        </article>`;
    })
    .join("") || `<div class="empty-state">No products yet.</div>`;
}

async function signOutAdmin() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    setAdminMessage(error.message, "error");
    return;
  }
  location.replace("/auth.html");
}

function previewImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("imagePreview");
  if (!file) {
    preview.hidden = true;
    return;
  }

  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.hidden = false;
  preview.onload = () => URL.revokeObjectURL(url);
}

function setAdminMessage(message, type = "") {
  const element = document.getElementById("adminMessage");
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`.trim();
}

function showAdminGate(message) {
  document.body.innerHTML = `
    <main class="auth-shell">
      <section class="auth-card">
        <div class="eyebrow">ZAYA ADMIN</div>
        <h1>Access denied</h1>
        <p>${escapeHtml(message)}</p>
        <a class="primary-button" href="/auth.html">Return to sign in</a>
      </section>
    </main>`;
}