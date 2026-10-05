# ZAYA — Vanilla HTML/CSS/JS + Supabase + Vercel

## Architecture

- `index.html` — storefront/catalog
- `product.html` — product detail page
- `auth.html` — Supabase email/password authentication
- `admin.html` — protected product publisher
- `css/style.css` — responsive boutique UI
- `js/supabase.js` — Supabase browser client + shared utilities
- `js/catalog.js` — catalog loading/filtering/auth state
- `js/product.js` — token/color routing + WhatsApp ordering
- `js/auth.js` — sign up/sign in/sign out
- `js/admin.js` — session/admin check + Storage upload + product insert
- `vercel.json` — clean product URLs
- `supabase.sql` — database/RLS/Storage setup

## 1. Configure Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase.sql`.
4. In Supabase Authentication, enable Email provider.
5. Create the first account from `/auth.html`.
6. Copy that user's UUID from Authentication > Users.
7. Run:
   `insert into public.admin_users (user_id) values ('YOUR-USER-UUID');`
8. Confirm Storage contains the public bucket `product-images`.

The browser must use only your project's publishable/anon key. Never use the service_role/secret key in this project.

## 2. Configure the static client

Open `js/supabase.js` and set:

- `SUPABASE_URL` to your Supabase Project URL.
- `SUPABASE_PUBLISHABLE_KEY` to your Supabase publishable/anon key.

This is the only unavoidable project-specific configuration in a purely static browser app. Vercel does not substitute private environment variables into static browser JavaScript.

## 3. Configure WhatsApp

Set `window.ZAYA_WHATSAPP_PHONE` in `product.html` to your store number in international digits, without `+`, spaces or dashes.

Example:
`919876543210`

If it is left blank, the button opens WhatsApp's generic share composer with the pre-filled order message.

## 4. Product variants

The `colors` column stores an array like:

[
  {
    "name": "Sage Green",
    "hex": "#8A9A86",
    "image": "https://..."
  },
  {
    "name": "Blush Pink",
    "hex": "#E8C5C8",
    "image": "https://..."
  }
]

The current admin form intentionally publishes one color variant per product row. If you need multiple colors on one product, add the first variant, then extend the row's `colors` JSONB array from the Supabase dashboard or add a dedicated variant-management UI.

## 5. Local testing

Because Supabase auth and browser routing work best over HTTP, serve the folder with any static HTTP server. Do not open HTML files with `file://`.

## 6. Vercel

Push the folder to GitHub and import the repository into Vercel.

No build command is required.

Framework preset: Other / static.

The included rewrite turns:

`/product/mulmul-anarkali-set?color=sage-green`

into:

`/product.html?token=mulmul-anarkali-set&color=sage-green`

The browser then uses `history.pushState()` when a user changes color, so the image and URL change without a page reload.

## 7. Supabase Auth redirect settings

In Authentication > URL Configuration, set:

- Site URL: your production Vercel domain
- Redirect URLs: your production Vercel domain plus `/admin.html`

For local testing, also add the local HTTP origin you use.

## 8. Important security note

The SQL contains the authenticated-only product policies requested in the brief. It also includes `admin_users` and the admin code checks that table. This is the recommended production arrangement: a visitor can sign up for an account, but only a UUID explicitly inserted into `admin_users` can publish products or upload product images.

Never put a Supabase service_role/secret key into a static website.
