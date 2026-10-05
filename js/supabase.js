/*
 * ZAYA Supabase client
 *
 * IMPORTANT:
 * A browser storefront must use the Supabase publishable/anon key only.
 * Never put a Supabase service_role/secret key in this file.
 *
 * Set these two values before deployment:
 *   SUPABASE_URL
 *   SUPABASE_PUBLISHABLE_KEY
 *
 * Because this is a static vanilla site, Vercel cannot inject server-side
 * environment variables into browser JavaScript at runtime. The publishable
 * key is intentionally safe for browser use when RLS is correctly configured.
 */
const SUPABASE_URL = window.ZAYA_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY =
  window.ZAYA_SUPABASE_PUBLISHABLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "ZAYA: Supabase configuration is missing. Set ZAYA_SUPABASE_URL and ZAYA_SUPABASE_PUBLISHABLE_KEY in js/supabase.js."
  );
}

const supabaseClient =
  window.supabase && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
    : null;

window.ZayaSupabase = {
  client: supabaseClient,
  isConfigured: Boolean(supabaseClient)
};

async function requireSupabase() {
  if (!supabaseClient) {
    throw new Error(
      "Supabase is not configured. Add your Supabase URL and publishable key in js/supabase.js."
    );
  }
  return supabaseClient;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatINR(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(number);
}

function calculateDiscount(price, mrp) {
  const p = Number(price);
  const m = Number(mrp);
  if (!Number.isFinite(p) || !Number.isFinite(m) || m <= p || m <= 0) return 0;
  return Math.round(((m - p) / m) * 100);
}

function getFirstVariant(product) {
  return Array.isArray(product?.colors) && product.colors.length
    ? product.colors[0]
    : null;
}

function variantSlug(variant) {
  return slugify(variant?.name || "");
}

function getProductUrl(product, colorName) {
  const color = colorName || getFirstVariant(product)?.name || "";
  const query = color ? `?color=${encodeURIComponent(slugify(color))}` : "";
  return `/product/${encodeURIComponent(product.token)}${query}`;
}

function getPublicStorageUrl(path) {
  if (!supabaseClient || !path) return "";
  const { data } = supabaseClient.storage
    .from("product-images")
    .getPublicUrl(path);
  return data?.publicUrl || "";
}

window.ZayaUtils = {
  escapeHtml,
  slugify,
  formatINR,
  calculateDiscount,
  getFirstVariant,
  variantSlug,
  getProductUrl,
  getPublicStorageUrl
};