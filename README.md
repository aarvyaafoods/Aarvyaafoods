# Aarvya — Natural Healthy Laddus Storefront

White + Orange theme inspired by Veirdo.in. Built with Next.js 14 App Router (JavaScript only).
## deploy to vercel testing 
## Quick Start

```bash
cd Aarvya
npm install
npm run dev
# Open http://localhost:3000
```

## 🎨 How to Change Colors

Open `src/styles/globals.css` and edit the `:root` CSS variables:

```css
:root {
  --color-primary:       #F97316;  /* Main accent — change this to any color */
  --color-primary-dark:  #EA580C;  /* Hover state of primary */
  --color-primary-light: #FED7AA;  /* Light tint of primary */
  --color-surface:        #FFFFFF; /* Page background */
  --color-surface-alt:    #F8F7F5; /* Card backgrounds */
  --color-ink:       #111111;      /* Main text */
  --color-ink-muted: #6B7280;      /* Secondary text */
  --color-line:      #E5E0D8;      /* Borders */
}
```

**Example color swaps:**
- Blue theme: `--color-primary: #3B82F6`
- Green theme: `--color-primary: #16A34A`
- Purple theme: `--color-primary: #7C3AED`
- Red theme: `--color-primary: #DC2626`

## Pages & Routes

| Route | Page |
|---|---|
| `/` | Home — Hero, Categories, Featured, Promos, New Arrivals, Sale |
| `/plp` | Product Listing — Filters, Sort, Search params |
| `/plp?category=women` | Filtered by category |
| `/plp?tag=NEW` | New arrivals |
| `/plp?tag=SALE` | Sale items |
| `/plp?q=keyword` | Search results |
| `/pdp?id=1` | Product detail page |
| `/cart` | Shopping cart with promo codes |
| `/checkout` | 3-step checkout |
| `/confirm` | Order confirmation |
| `/profile` | Account — Orders, Addresses, Wishlist, Settings |

## Features
- ✅ Hero carousel (auto-play, arrows, dots)
- ✅ Category circles strip
- ✅ Product cards — image hover zoom, slide-up quick-add, wishlist heart, star ratings
- ✅ PLP — sidebar filters (size, color, brand, price), sort, mobile filter drawer
- ✅ PDP — gallery, color/size selectors, qty, tabs, notify-me, related products
- ✅ Cart — qty editor, remove, promo code engine (FIRST10 / FREESHIP / SAVE500)
- ✅ Checkout — 3 steps (Address → Review → Payment)
- ✅ Order confirmation page
- ✅ Profile — orders table + detail modal, addresses CRUD, wishlist, settings with toggles
- ✅ Cart + wishlist persisted to localStorage
- ✅ Fully mobile responsive with drawer navigation
- ✅ Search overlay with popular suggestions
- ✅ Toast notifications
- ✅ 404 page

## Promo Codes (for testing)
| Code | Description |
|---|---|
| `FIRST10` | 10% off your order |
| `FREESHIP` | Free shipping |
| `SAVE500` | ₹500 off orders above ₹2000 |

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.js           # Root layout (fonts, providers)
│   ├── page.js             # Home
│   ├── plp/page.js
│   ├── pdp/page.js
│   ├── cart/page.js
│   ├── checkout/page.js
│   ├── confirm/page.js
│   ├── profile/page.js
│   └── not-found.js
├── components/
│   ├── layout/             # MainLayout, Header, Footer, AnnouncementBar
│   ├── ui/                 # ProductCard, SectionHeader, Breadcrumb
│   ├── home/               # HeroSection, CategoryStrip, FeaturedProducts, ...
│   ├── plp/                # PLPPage (with inline FilterSidebar)
│   ├── pdp/                # PDPPage
│   ├── cart/               # CartPage
│   ├── checkout/           # CheckoutPage, ConfirmPage
│   └── profile/            # ProfilePage, OrdersSection, AddressesSection,
│                           #   WishlistSection, SettingsSection
├── context/
│   └── StoreContext.js     # Cart + wishlist global state (localStorage)
├── data/
│   └── products.js         # All dummy data
├── lib/
│   └── utils.js            # formatPrice, statusColor, cn helpers
└── styles/
    └── globals.css         # Tailwind + CSS variable color tokens
```
