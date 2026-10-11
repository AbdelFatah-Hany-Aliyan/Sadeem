# Sadeem (سديم) — Official Website

> **We Build Systems. We Turn Ideas Into Companies.**  
> **نبني الأنظمة. نحوّل الأفكار إلى شركات.**

Sadeem is a modern technology Startup Studio with a dual-engine model:
1. **Sadeem Systems:** Engineering custom digital systems and operational software for businesses.
2. **Sadeem Ventures:** Validating, incubating, and building scalable digital products and ventures.

This repository hosts the official Sadeem company showcase, engineered with a static-first architecture, comprehensive bilingual (Arabic/English) localization, and an editorial dark/light theme system.

---

## Technology Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Static Generation)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Motion & Interactions:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Theme Management:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Fonts:** Next Font (`Inter` for English, `Noto Kufi Arabic` for Arabic)

---

## Getting Started

### Prerequisites

- Node.js 18.17+ or later
- npm (or pnpm / yarn)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/AbdelFatah-Hany-Aliyan/Sadeem.git
cd Sadeem
npm install
```

### Development Server

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Validation & Build

Always ensure code passes linting and compiles cleanly before submitting changes:

```bash
# Check code style and lint rules
npm run lint

# Compile optimized static production build
npm run build

# Preview production build locally
npm run start
```

---

## Project Structure

```text
/src
├── app/                  # Next.js App Router (layout, global styles, page)
├── components/           # Reusable UI components
│   ├── sections/         # Homepage sections (Hero, DualEngine, Work, etc.)
│   ├── Navigation.tsx    # Header with language & theme toggles, mobile menu
│   └── Footer.tsx        # Localized footer
├── content/              # Localized dictionaries (en.ts, ar.ts, index.ts)
├── data/                 # Typed project and studio records (projects.ts)
└── providers/            # Context providers (LanguageProvider, Providers)
/public                   # Static public assets
```

---

## Collaboration & Contribution Guidelines

To maintain code quality and deployment stability:

1. **Stable Branch:** `main` represents production-ready code. Direct commits to `main` are restricted.
2. **Feature Branches:** Create a new branch for every task or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Pull Requests:** Open a Pull Request against `main`. Describe your changes clearly.
4. **Verification:** Ensure both `npm run lint` and `npm run build` pass with zero errors prior to requesting review.
5. **Review:** All changes require team review and approval before merging into `main`.
