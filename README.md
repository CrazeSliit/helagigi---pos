# HeladiGi POS — UI (Next.js)

High-fidelity, interactive UI for **HeladiGi POS**, a multi-branch point-of-sale and retail management system for Sri Lankan businesses. UI only: every screen runs on realistic sample data in `lib/data.ts`. There is no backend.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
# or a production build
npm run build && npm start
```

Requires Node 18.18+ (built and tested on Node 22, Next.js 15, React 19, Tailwind CSS 3).

## Stack

- **Next.js 15 App Router** with TypeScript. All 75 routes are prerendered as static pages.
- **Tailwind CSS 3**. Semantic colour tokens are CSS variables in `app/globals.css`, so every screen supports light and dark mode.
- **lucide-react** for rounded line icons, **recharts** for charts and **qrcode.react** for LankaQR and e-receipt codes.
- **@fontsource** packages for Poppins (headings), Inter (UI) and Noto Sans Sinhala / Tamil. The fonts are self-hosted, so the app works offline.

## Where things live

| Path | What |
|---|---|
| `app/globals.css` | Design tokens (light + dark), base styles, component classes (`.btn`, `.field`, `.tbl`…) |
| `tailwind.config.ts` | Brand primitives, type scale, radii, shadows, animations |
| `components/ui.tsx` | Buttons, inputs, toggles, chips, tabs, KPI card, stepper, pagination, empty state… |
| `components/overlays.tsx` | Modal, confirm dialog, drawer, toaster, tooltip, dropdown |
| `components/pos-kit.tsx` | Keypad, denomination counter, product card, cart line, thermal receipt |
| `components/pos-modals.tsx` | Payment (6 methods), sale complete, receipt, held orders, discount, override PIN, coupon, customer, variant, weight, line edit |
| `components/shell.tsx` | Sidebar, top bar, sync pill, language switch, command palette (Ctrl+K), notifications |
| `components/charts.tsx` | Area/line, bar (vertical, horizontal, stacked), donut, heatmap |
| `lib/i18n.ts` | EN / සිං / தமிழ் strings for navigation, top bar, POS and payment |
| `lib/data.ts` | Sample products, customers, staff, branches, orders and suppliers |

## Key routes

- `/login`, `/login/pin`, `/forgot`, `/branch-select`, `/lock`. The demo PIN is **1234**.
- `/dashboard`. The mobile layout appears at 390 px.
- `/pos` is the full-screen terminal, designed for 1024 px tablet landscape and 1440 px desktop.
- `/design-system` is the component library with every state.
- Module pages: `/orders`, `/returns`, `/products`, `/inventory`, `/purchasing`, `/customers`, `/promotions`, `/register`, `/expenses`, `/payments`, `/reports`, `/staff`, `/branches`, `/restaurant`, `/kds`, `/notifications`, `/settings`, `/audit`, `/onboarding`, `/help`.

### POS demo states

To open any POS state directly, add `?state=` to the URL: `empty`, `cart`, `pay-cash`, `pay-card`, `pay-qr`, `pay-credit`, `pay-gift`, `pay-split`, `done`, `receipt`, `held`, `discount`, `coupon`, `customer`, `variant`, `weight`, `override`, `edit`, `clear`, `offline`.

You can combine a state with `&lang=si`, `&lang=ta` or `&theme=dark`. For example, `/pos?state=cart&lang=si`.

POS keyboard shortcuts: F1 search, F2 customer, F4 hold, F8 discount, F12 pay, Esc close. Enter in the search bar adds the first match, the same as a barcode scan.

## Design decisions to review

- **Text on orange.** White on `#FF7A00` has a contrast ratio of 2.6:1, which fails WCAG AA even for large bold text. Orange CTAs therefore use navy text (6.2:1). To change this, edit the `--on-accent` token in `globals.css`.
- **Logo.** The wordmark in `public/brand/` is cropped from the supplied logo, with the white background made transparent. It has not been redrawn or recoloured. On navy it always sits on a white tile. `scripts/assets.py` shows how the logo crop and the Raksha line art were made from the supplied files.
- **Product images.** Product images are category-coloured placeholder tiles with icons. Replace them with real photos.
- **Translations.** The Sinhala and Tamil strings in `lib/i18n.ts` and `lib/data.ts` should be reviewed by a native speaker before release.
