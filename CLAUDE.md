# CLAUDE.md

This file provides guidance for AI assistants working with the Clause-test repository.

## Project Overview

Clarity Finance is a personal finance consulting business website. It's a static, single-page site designed to be shared with potential clients so they can learn about services, read testimonials, and get in touch.

The site is built with plain HTML, CSS, and vanilla JavaScript — no frameworks or build tools. This keeps it fast, simple, and easy to host on any static hosting provider (GitHub Pages, Netlify, Vercel, etc.).

## Repository Structure

```
/
├── index.html       # Single-page website (all sections)
├── styles.css       # All styling, responsive design
├── script.js        # Mobile navigation toggle
├── README.md        # Project title and description
├── CLAUDE.md        # This file — AI assistant guidance
└── .git/            # Git version control
```

## Tech Stack

- **HTML5** — semantic markup, no templating
- **CSS3** — custom properties, grid, flexbox, media queries
- **Vanilla JS** — minimal, only for mobile nav toggle
- **No build step** — open `index.html` in a browser to preview

## Site Sections

The site is a single-page layout with these sections (in order):

1. **Header** — fixed nav bar with logo and links, mobile hamburger menu
2. **Hero** — headline, subtitle, two CTA buttons
3. **About** — bio, photo placeholder, stats (clients, experience, satisfaction)
4. **Services** — 6-card grid (budgeting, investing, debt, retirement, education, coaching)
5. **Approach** — 3-step "how it works" process
6. **Testimonials** — 3 client testimonial cards
7. **Contact/CTA** — email, phone, location with CTA button
8. **Footer** — logo and copyright

## Design System

- **Color palette**: teal primary (`#2b6777`), warm orange accent (`#f2a154`), neutral text
- **Typography**: Georgia for headings (serif), system UI stack for body (sans-serif)
- **Style**: professional and minimal, warm background tones, card-based layouts
- **Responsive breakpoints**: 900px (tablet), 680px (mobile)

## Development Guidelines

### Editing Content

- All text content is in `index.html` — update directly
- Placeholder items to customize: business name, bio text, photo, contact details, stats, testimonials
- Replace "Clarity Finance" with the actual business name throughout `index.html` and `styles.css` if needed

### Styling

- CSS custom properties are defined at the top of `styles.css` in `:root` — change colors/fonts there
- Sections are self-contained in the CSS, organized with comment headers
- Mobile styles are at the bottom in `@media` blocks

### Adding Images

- Replace the `about-image-placeholder` div with an `<img>` tag
- Optimize images before adding (compress, appropriate dimensions)

### General Conventions

- Keep it static — no build tools or frameworks unless complexity demands it
- Prefer CSS for animations and transitions over JavaScript
- Keep `script.js` minimal
- Do not commit IDE-specific files, OS artifacts, or secrets

## Common Commands

```bash
# Preview locally (Python)
python3 -m http.server 8000

# Preview locally (Node)
npx serve .

# Or simply open index.html directly in a browser
```
