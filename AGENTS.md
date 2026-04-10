# OpenCode Instructions for DryChickenSCM

## Architecture & Layout
* **App Directory**: The actual React application is located in `scm-demo/`. All `npm` commands, `vite` commands, and source file modifications must take place inside this folder.
* **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS (v3), Recharts, Lucide React.
* **Component Structure**: Follow a modular React component approach inside `scm-demo/src/components/`. Use modern React Hooks and functional components.

## Design System (CRITICAL)
This project strictly follows the Inter-based design system documented in `DESIGN.md`. Do not invent new colors, shadows, or fonts. Do not use default generic Tailwind classes if a custom token exists in `tailwind.config.js`.

**Required Tailwind Tokens**:
* **Colors**: 
  * Backgrounds: `bg-pureWhite` (primary), `bg-lightSurface` (secondary).
  * Text: `text-nearBlack` (primary text, NO pure `#000000`), `text-secondaryGray`.
  * Accents: `bg-rausch`, `text-rausch` (`#ff385c` - strictly for main CTAs and branding).
  * Status: `text-errorRed`, `bg-errorRed/10`, etc.
* **Shadows & Depth**: 
  * Cards/Elevated surfaces: `shadow-card` (a required 3-layer shadow).
  * Hover states: `shadow-hover`.
* **Border Radius**: 
  * Buttons: `rounded` (8px).
  * Badges/Tags: `rounded-badge` (14px).
  * Cards/Containers: `rounded-card` (20px).
  * Layout Elements: `rounded-large` (32px).
* **Typography**:
  * The font `Inter` is the primary font (`font-sans`).
  * Headings use tight letter spacing (`tracking-tight` or negative values like `tracking-[-0.44px]`).

## Commands
Run all commands inside the `scm-demo` directory:
* **Start Dev Server**: `npm run dev`
* **Typecheck & Build**: `npm run build`
* **Lint**: `npm run lint`

## Conventions
* Use `lucide-react` for icons. Size them explicitly (e.g., `size={20}`).
* Use `recharts` for charts. Ensure tooltips use `shadow-card` and `rounded-badge` styling to match the design system.
* Keep inline styles to an absolute minimum; rely on Tailwind classes and custom tokens.