import type { WizardDraft } from "@/components/wizard/draft";
import { buildPortfolioViewModel, type PortfolioViewModel } from "@/lib/portfolio";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

const ICONS = {
  github: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="icon"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.744.083-.729.083-.729 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.468-2.382 1.236-3.222-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 6.3c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.912 1.235 3.222 0 4.609-2.807 5.622-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.9-.014 3.293 0 .322.216.696.825.578C20.565 22.295 24 17.8 24 12.5 24 5.87 18.627.5 12 .5Z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  messageSquare: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`,
  graduation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
  languages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`,
  laptop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`,
  contrast: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
};

const PORTFOLIO_CSS = `
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --border: oklch(0.922 0 0);
  --border-grid: oklch(0.922 0 0 / 60%);
  --ring-card: oklch(0.145 0 0 / 10%);
  --surface-muted: oklch(0.97 0 0 / 28%);
  --radius: 0.625rem;
  --header-height: 3.5rem;
  --font-sans: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --border-grid: oklch(1 0 0 / 10%);
  --ring-card: oklch(1 0 0 / 12%);
  --surface-muted: transparent;
}

@media (min-width: 64rem) {
  :root {
    --header-height: 4rem;
  }
}

*, *::before, *::after {
  box-sizing: border-box;
  border-color: var(--border);
}

html {
  font-family: var(--font-sans);
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  color: var(--foreground);
  font-size: 0.9375rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection {
  background: var(--primary);
  color: var(--primary-foreground);
}

a {
  color: inherit;
  text-decoration: none;
}

h1, h2, h3, p, ul, ol {
  margin: 0;
}

.icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.mono {
  font-family: var(--font-mono);
}

.tabular {
  font-variant-numeric: tabular-nums;
}

.container-wrapper {
  width: 100%;
  max-width: 88rem;
  margin-inline: auto;
}

@media (min-width: 80rem) {
  .container-wrapper {
    border-inline: 1px solid var(--border-grid);
  }
}

.band {
  border-bottom: 1px solid var(--border-grid);
  scroll-margin-top: var(--header-height);
}

.band:last-child {
  border-bottom: 0;
}

.band-muted {
  background-color: var(--surface-muted);
}

.band-inner {
  padding: 2.75rem 1rem;
}

@media (min-width: 640px) {
  .band-inner {
    padding: 3.5rem 1.5rem;
  }
}

@media (min-width: 768px) {
  .band-inner {
    padding: 4rem 2.5rem;
  }
}

/* Header */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  border-bottom: 1px solid var(--border-grid);
  background: color-mix(in oklch, var(--background) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.header-inner {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-inline: 1rem;
}

@media (min-width: 640px) {
  .header-inner {
    padding-inline: 1.5rem;
  }
}

.nav-links {
  display: none;
  align-items: center;
  gap: 0.25rem;
}

@media (min-width: 768px) {
  .nav-links {
    display: flex;
  }
}

.nav-link {
  padding: 0.375rem 0.625rem;
  border-radius: calc(var(--radius) * 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted-foreground);
  transition: background-color 150ms ease, color 150ms ease;
}

.nav-link:hover {
  background: var(--muted);
  color: var(--foreground);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

/* Theme Select */
.theme-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 2rem;
  border-radius: calc(var(--radius) * 0.8);
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  padding-inline: 0.5rem;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background-color 150ms ease;
}

.theme-control:hover {
  background: var(--muted);
}

.theme-control .icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--muted-foreground);
}

.theme-select {
  appearance: none;
  background: transparent;
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding-right: 0.25rem;
  outline: none;
}

.theme-select option {
  background: var(--background);
  color: var(--foreground);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4375rem;
  height: 2rem;
  padding-inline: 0.75rem;
  border-radius: calc(var(--radius) * 0.8);
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, opacity 150ms ease;
}

.btn-lg {
  height: 2.375rem;
  padding-inline: 1rem;
}

.btn-pill {
  border-radius: 9999px;
}

.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
}

.btn-primary:hover {
  opacity: 0.88;
}

.btn-outline {
  border-color: var(--border);
  background: var(--background);
  color: var(--foreground);
}

.btn-outline:hover {
  background: var(--muted);
}

.btn-ghost {
  background: transparent;
  color: var(--muted-foreground);
}

.btn-ghost:hover {
  background: var(--muted);
  color: var(--foreground);
}

.mobile-menu-btn {
  width: 2rem;
  padding-inline: 0;
}

@media (min-width: 768px) {
  .mobile-menu-btn {
    display: none;
  }
}

.mobile-nav {
  display: none;
  border-top: 1px solid var(--border-grid);
  padding: 0.625rem 1rem;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.mobile-nav.open {
  display: flex;
}

@media (min-width: 768px) {
  .mobile-nav,
  .mobile-nav.open {
    display: none;
  }
}

/* Cards */
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: calc(var(--radius) * 1.4);
  background: var(--card);
  color: var(--card-foreground);
  box-shadow: 0 0 0 1px var(--ring-card);
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.card-interactive {
  cursor: pointer;
  transition: background-color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
}

.card-interactive:hover {
  background: color-mix(in oklch, var(--muted) 45%, var(--card));
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--foreground) 24%, transparent);
}

.card-interactive:active {
  transform: translateY(1px);
}

.card-interactive:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--foreground);
}

.card-header {
  display: grid;
  gap: 0.25rem;
  padding: 1.125rem 1.25rem;
}

.card-header-bordered {
  border-bottom: 1px solid var(--border-grid);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.015em;
  color: var(--foreground);
}

.card-description {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.card-content {
  padding: 1.125rem 1.25rem;
  flex: 1;
}

.card-header + .card-content {
  padding-top: 0;
}

.card-header-bordered + .card-content {
  padding-top: 1.125rem;
}

.card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid var(--border-grid);
  background: color-mix(in oklch, var(--muted) 50%, transparent);
  padding: 0.75rem 1.25rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: calc(var(--radius) * 0.8);
  background: var(--muted);
  color: var(--foreground);
  flex-shrink: 0;
}

/* Badges & Pills */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background: var(--secondary);
  color: var(--secondary-foreground);
  padding: 0.1875rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
}

.badge-outline {
  border: 1px solid var(--border);
  background: color-mix(in oklch, var(--muted) 35%, transparent);
  color: var(--foreground);
  border-radius: calc(var(--radius) * 0.75);
}

.badge-mono {
  border-radius: calc(var(--radius) * 0.6);
  background: var(--muted);
  color: var(--muted-foreground);
  padding: 0.125rem 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 400;
}

/* Hero */
.hero-centered {
  max-width: 44rem;
  margin-inline: auto;
  text-align: center;
  align-items: center;
}

.hero-main {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.hero-heading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.hero-title {
  font-size: clamp(2.125rem, 4.5vw, 3.5rem);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.035em;
  color: var(--primary);
  text-wrap: balance;
}

.hero-role {
  font-size: clamp(1.0625rem, 2vw, 1.25rem);
  color: var(--muted-foreground);
  text-wrap: balance;
  max-width: 38rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  margin-top: 0.375rem;
}

/* Section Headers */
.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.section-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
}

.section-title {
  font-size: clamp(1.375rem, 2.5vw, 1.75rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
  color: var(--foreground);
}

.section-subtitle {
  font-size: 0.9375rem;
  color: var(--muted-foreground);
  margin-top: 0.25rem;
}

/* Grids */
.projects-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .projects-grid.cols-2,
  .projects-grid.cols-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .projects-grid.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.project-desc {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  white-space: pre-line;
  line-height: 1.6;
}

.project-link-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Experience Split Layout */
.experience-layout {
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;
}

@media (min-width: 64rem) {
  .experience-layout {
    grid-template-columns: minmax(0, 17rem) minmax(0, 1fr);
    gap: 3rem;
  }

  .experience-aside {
    position: sticky;
    top: calc(var(--header-height) + 2rem);
    align-self: start;
  }
}

.timeline {
  display: grid;
  gap: 1.25rem;
}

.exp-top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}

.exp-role {
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
}

.exp-company {
  font-size: 0.9375rem;
  color: var(--muted-foreground);
}

.exp-desc {
  margin-top: 0.625rem;
  font-size: 0.875rem;
  color: var(--muted-foreground);
  white-space: pre-line;
  line-height: 1.65;
}

/* Technologies */
.tech-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tech-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-grid);
  background: color-mix(in oklch, var(--muted) 35%, transparent);
  padding: 0.4375rem 0.75rem;
  font-size: 0.875rem;
}

.tech-name {
  font-weight: 500;
  color: var(--foreground);
}

.tech-duration {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted-foreground);
  font-variant-numeric: tabular-nums;
}

/* Education & Languages */
.two-col-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .two-col-grid.has-both {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.list-divide > * + * {
  border-top: 1px solid var(--border-grid);
  padding-top: 0.875rem;
  margin-top: 0.875rem;
}

.edu-row-top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.375rem 0.75rem;
}

.edu-degree {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--foreground);
}

.edu-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}

.lang-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.lang-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-grid);
  background: color-mix(in oklch, var(--muted) 35%, transparent);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.lang-name {
  font-weight: 500;
  color: var(--foreground);
}

.lang-level {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

/* Setup / Uses Grid */
.setup-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .setup-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .setup-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Contact */
.contact-card-inner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .contact-card-inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 2rem;
  }
}

.contact-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
}

/* Footer */
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--border-grid);
}

.footer-inner {
  min-height: 3rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--muted-foreground);
  transition: color 150ms ease;
}

.footer-link:hover {
  color: var(--foreground);
}

.footer-link:hover .footer-brand {
  text-decoration: underline;
  text-underline-offset: 4px;
}

@media (min-width: 640px) {
  .footer-inner {
    padding-inline: 1.5rem;
  }
}

@media print {
  .site-header,
  .mobile-nav {
    display: none !important;
  }
  body {
    background: #fff;
    color: #111;
  }
  .band-inner {
    padding-block: 1.5rem;
  }
  .card {
    break-inside: avoid;
  }
}
`;

function renderHeader(navItems: { id: string; label: string }[]): string {
  const navLinksHtml = navItems
    .map(
      (item) => `<a class="nav-link" href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`,
    )
    .join("");

  const mobileLinksHtml = navItems
    .map(
      (item) => `<a class="nav-link" href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`,
    )
    .join("");

  return `
  <header class="site-header">
    <div class="container-wrapper header-inner">
      ${navItems.length > 0 ? `<nav class="nav-links" aria-label="Portfolio sections">${navLinksHtml}</nav>` : ""}

      <div class="header-actions">
        <label class="theme-control" aria-label="Theme">
          ${ICONS.contrast}
          <select id="theme-select" class="theme-select" aria-label="Theme">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        ${
          navItems.length > 0
            ? `<button type="button" id="mobile-menu-btn" class="btn btn-outline mobile-menu-btn" aria-expanded="false" aria-controls="mobile-nav" aria-label="Toggle navigation">${ICONS.menu}</button>`
            : ""
        }
      </div>
    </div>
    ${navItems.length > 0 ? `<nav id="mobile-nav" class="container-wrapper mobile-nav" aria-label="Mobile navigation">${mobileLinksHtml}</nav>` : ""}
  </header>`;
}

function renderHero(vm: PortfolioViewModel): string {
  const displayName = vm.fullName || "Developer Portfolio";
  const githubHref = safeHttpUrl(vm.github?.href);
  const linkedinHref = safeHttpUrl(vm.linkedin?.href);

  const hasContactSection = Boolean(vm.email || vm.phone || githubHref || linkedinHref);

  const metaPills: string[] = [];
  if (vm.location) {
    metaPills.push(
      `<span class="badge badge-outline">${ICONS.mapPin}<span>${escapeHtml(vm.location)}</span></span>`,
    );
  }

  return `
  <section id="top" class="band">
    <div class="container-wrapper band-inner">
      <div class="hero-main hero-centered">
        ${metaPills.length > 0 ? `<div class="hero-meta">${metaPills.join("")}</div>` : ""}
        <div class="hero-heading">
          <h1 class="hero-title">${escapeHtml(displayName)}</h1>
          ${vm.role ? `<p class="hero-role">${escapeHtml(vm.role)}</p>` : ""}
        </div>
        ${
          hasContactSection
            ? `<div class="hero-actions"><a href="#contact" class="btn btn-lg btn-pill btn-primary">${ICONS.messageSquare}<span>Get in touch</span></a></div>`
            : ""
        }
      </div>
    </div>
  </section>`;
}

function renderProjects(vm: PortfolioViewModel, muted: boolean): string {
  if (vm.projects.length === 0) return "";
  const colClass = vm.projects.length >= 3 ? "cols-3" : vm.projects.length === 2 ? "cols-2" : "";

  const cards = vm.projects
    .map((proj) => {
      const href = safeHttpUrl(proj.linkHref);
      const titleText = escapeHtml(proj.name || "Untitled project");
      const tag = href ? "a" : "article";
      const attrs = href
        ? `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="card card-interactive"`
        : `class="card"`;

      return `
      <${tag} ${attrs}>
        <div class="card-header">
          <h3 class="card-title">${titleText}</h3>
        </div>
        ${
          proj.description
            ? `<div class="card-content"><p class="project-desc">${escapeHtml(proj.description)}</p></div>`
            : ""
        }
        ${
          proj.linkDisplay
            ? `<div class="card-footer">
                <span class="mono project-link-text">${escapeHtml(proj.linkDisplay)}</span>
              </div>`
            : ""
        }
      </${tag}>`;
    })
    .join("");

  return `
  <section id="projects" class="band ${muted ? "band-muted" : ""}">
    <div class="container-wrapper band-inner">
      <div class="section-head">
        <div>
          <div class="section-title-row">
            <h2 class="section-title">Projects</h2>
          </div>
          <p class="section-subtitle">Selected builds, open-source repositories, and shipped work.</p>
        </div>
      </div>
      <div class="projects-grid ${colClass}">
        ${cards}
      </div>
    </div>
  </section>`;
}

function renderExperience(vm: PortfolioViewModel, muted: boolean): string {
  if (vm.experiences.length === 0) return "";

  const items = vm.experiences
    .map((exp) => {
      const dateStr = exp.dates ? `${exp.dates}${exp.duration ? ` · ${exp.duration}` : ""}` : "";

      return `
      <article class="card">
        <div class="card-content">
          <div class="exp-top">
            <div>
              <span class="exp-role">${escapeHtml(exp.role || "Untitled role")}</span>
              ${exp.company ? `<span class="exp-company"> · ${escapeHtml(exp.company)}</span>` : ""}
            </div>
            ${dateStr ? `<span class="badge-mono tabular">${escapeHtml(dateStr)}</span>` : ""}
          </div>
          ${exp.description ? `<p class="exp-desc">${escapeHtml(exp.description)}</p>` : ""}
        </div>
      </article>`;
    })
    .join("");

  return `
  <section id="experience" class="band ${muted ? "band-muted" : ""}">
    <div class="container-wrapper band-inner">
      <div class="experience-layout">
        <div class="experience-aside">
          <div class="section-title-row">
            <span class="icon-box">${ICONS.briefcase}</span>
            <h2 class="section-title">Experience</h2>
            ${vm.totalExperienceDuration ? `<span class="badge-mono">${escapeHtml(vm.totalExperienceDuration)}</span>` : ""}
          </div>
          <p class="section-subtitle" style="margin-top:0.5rem">Roles, responsibilities, and production systems shipped over time.</p>
        </div>
        <div class="timeline">
          ${items}
        </div>
      </div>
    </div>
  </section>`;
}

function renderTechnologies(vm: PortfolioViewModel, muted: boolean): string {
  if (vm.technologyTotals.length === 0) return "";

  const pills = vm.technologyTotals
    .map(
      (tech) => `
      <div class="tech-pill">
        <span class="tech-name">${escapeHtml(tech.label)}</span>
        ${tech.duration ? `<span class="tech-duration">${escapeHtml(tech.duration)}</span>` : ""}
      </div>`,
    )
    .join("");

  return `
  <section id="technologies" class="band ${muted ? "band-muted" : ""}">
    <div class="container-wrapper band-inner">
      <div class="section-head">
        <div>
          <div class="section-title-row">
            <span class="icon-box">${ICONS.code}</span>
            <h2 class="section-title">Technologies</h2>
          </div>
          <p class="section-subtitle">Technologies aggregated across experience timelines.</p>
        </div>
      </div>
      <div class="tech-list">
        ${pills}
      </div>
    </div>
  </section>`;
}

function renderBackground(vm: PortfolioViewModel, muted: boolean): string {
  const hasEdu = vm.education.length > 0;
  const hasLang = vm.languages.length > 0;
  if (!hasEdu && !hasLang) return "";

  const eduCard = hasEdu
    ? `
    <article class="card">
      <div class="card-header card-header-bordered">
        <div class="card-header-row">
          <div class="section-title-row">
            <span class="icon-box">${ICONS.graduation}</span>
            <h2 class="card-title" style="font-size:1.125rem">Education</h2>
          </div>
          ${vm.totalEducationDuration ? `<span class="badge-mono">${escapeHtml(vm.totalEducationDuration)}</span>` : ""}
        </div>
      </div>
      <div class="card-content list-divide">
        ${vm.education
          .map((edu) => {
            const dateStr = edu.dates
              ? `${edu.dates}${edu.duration ? ` · ${edu.duration}` : ""}`
              : "";
            return `
            <div>
              <div class="edu-row-top">
                <span class="edu-degree">${escapeHtml(edu.degree || "Untitled degree")}</span>
                ${dateStr ? `<span class="badge-mono tabular">${escapeHtml(dateStr)}</span>` : ""}
              </div>
              <div class="edu-meta">
                ${edu.university ? `<span>${escapeHtml(edu.university)}</span>` : ""}
                ${edu.levelLabel ? `<span class="badge">${escapeHtml(edu.levelLabel)}</span>` : ""}
              </div>
            </div>`;
          })
          .join("")}
      </div>
    </article>`
    : "";

  const langCard = hasLang
    ? `
    <article class="card">
      <div class="card-header card-header-bordered">
        <div class="card-header-row">
          <div class="section-title-row">
            <span class="icon-box">${ICONS.languages}</span>
            <h2 class="card-title" style="font-size:1.125rem">Languages</h2>
          </div>
        </div>
      </div>
      <div class="card-content">
        <div class="lang-grid">
          ${vm.languages
            .map(
              (lang) => `
              <div class="lang-pill">
                <span class="lang-name">${escapeHtml(lang.language)}</span>
                ${lang.fluencyLabel ? `<span class="lang-level">${escapeHtml(lang.fluencyLabel)}</span>` : ""}
              </div>`,
            )
            .join("")}
        </div>
      </div>
    </article>`
    : "";

  return `
  <section id="background" class="band ${muted ? "band-muted" : ""}">
    <div class="container-wrapper band-inner">
      <div class="two-col-grid ${hasEdu && hasLang ? "has-both" : ""}">
        ${eduCard}
        ${langCard}
      </div>
    </div>
  </section>`;
}

function renderSetup(vm: PortfolioViewModel, muted: boolean): string {
  if (vm.setups.length === 0) return "";

  const items = vm.setups
    .map(
      (item) => `
      <article class="card">
        <div class="card-content">
          <h3 class="card-title">${escapeHtml(item.name || "Untitled item")}</h3>
          ${
            item.description
              ? `<p class="project-desc" style="margin-top:0.375rem">${escapeHtml(item.description)}</p>`
              : ""
          }
        </div>
      </article>`,
    )
    .join("");

  return `
  <section id="setup" class="band ${muted ? "band-muted" : ""}">
    <div class="container-wrapper band-inner">
      <div class="section-head">
        <div>
          <div class="section-title-row">
            <span class="icon-box">${ICONS.laptop}</span>
            <h2 class="section-title">Setup</h2>
          </div>
          <p class="section-subtitle">Hardware, software, and daily tools that power my workflow.</p>
        </div>
      </div>
      <div class="setup-grid">
        ${items}
      </div>
    </div>
  </section>`;
}

function renderContact(vm: PortfolioViewModel, muted: boolean): string {
  const githubHref = safeHttpUrl(vm.github?.href);
  const linkedinHref = safeHttpUrl(vm.linkedin?.href);

  if (!vm.email && !vm.phone && !githubHref && !linkedinHref) return "";

  const links: string[] = [];
  if (vm.email) {
    links.push(
      `<button type="button" class="btn btn-lg btn-pill btn-primary copy-btn" data-copy="${escapeHtml(vm.email)}" data-label="${escapeHtml(vm.email)}">${ICONS.mail}<span>${escapeHtml(vm.email)}</span></button>`,
    );
  }
  if (vm.phone) {
    links.push(
      `<button type="button" class="btn btn-lg btn-pill btn-outline copy-btn" data-copy="${escapeHtml(vm.phone)}" data-label="${escapeHtml(vm.phone)}">${ICONS.phone}<span class="tabular">${escapeHtml(vm.phone)}</span></button>`,
    );
  }
  if (githubHref) {
    links.push(
      `<a href="${escapeHtml(githubHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-pill btn-outline">${ICONS.github}<span>GitHub</span></a>`,
    );
  }
  if (linkedinHref) {
    links.push(
      `<a href="${escapeHtml(linkedinHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-pill btn-outline">${ICONS.linkedin}<span>LinkedIn</span></a>`,
    );
  }

  return `
  <section id="contact" class="band ${muted ? "band-muted" : ""}">
    <div class="container-wrapper band-inner">
      <div class="card">
        <div class="contact-card-inner">
          <h2 class="section-title">Get in touch</h2>
          <div class="contact-actions">
            ${links.join("")}
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

const PORTFOLIO_SCRIPT = `
(function () {
  var root = document.documentElement;
  var select = document.getElementById("theme-select");
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var storageKey = "prezentme-portfolio-theme";

  function applyTheme(mode) {
    var isDark = mode === "dark" || (mode === "system" && media && media.matches);
    root.classList.toggle("dark", Boolean(isDark));
  }

  var saved = "system";
  try {
    saved = localStorage.getItem(storageKey) || "system";
  } catch (e) {}
  if (saved !== "light" && saved !== "dark" && saved !== "system") saved = "system";

  applyTheme(saved);
  if (select) {
    select.value = saved;
    select.addEventListener("change", function () {
      var next = select.value;
      try {
        localStorage.setItem(storageKey, next);
      } catch (e) {}
      applyTheme(next);
    });
  }

  if (media) {
    var onMediaChange = function () {
      var current = select ? select.value : saved;
      if (current === "system") applyTheme("system");
    };
    if (media.addEventListener) media.addEventListener("change", onMediaChange);
    else if (media.addListener) media.addListener(onMediaChange);
  }

  var menuBtn = document.getElementById("mobile-menu-btn");
  var mobileNav = document.getElementById("mobile-nav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    var timer = null;
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      if (!value || !navigator.clipboard) return;
      navigator.clipboard.writeText(value).then(function () {
        var label = btn.querySelector("span");
        if (!label) return;
        var original = btn.getAttribute("data-label") || value;
        label.textContent = "Copied";
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
          label.textContent = original;
          timer = null;
        }, 1800);
      }).catch(function () {});
    });
  });
})();
`;

/** Generates a standalone, responsive HTML5 developer portfolio matching the `/prezent-me` design system. */
export function generatePortfolioHtml(draft: WizardDraft): string {
  const vm = buildPortfolioViewModel(draft);
  const displayName = vm.fullName || "Developer Portfolio";
  const pageTitle = vm.role ? `${displayName} — ${vm.role}` : displayName;
  const metaDescription = vm.role
    ? `${displayName} — ${vm.role}${vm.location ? ` (${vm.location})` : ""}`
    : `${displayName} developer portfolio`;

  const githubHref = safeHttpUrl(vm.github?.href);
  const linkedinHref = safeHttpUrl(vm.linkedin?.href);
  const hasContact = Boolean(vm.email || vm.phone || githubHref || linkedinHref);

  const navItems: { id: string; label: string }[] = [];
  if (vm.experiences.length > 0) navItems.push({ id: "experience", label: "Experience" });
  if (vm.technologyTotals.length > 0) navItems.push({ id: "technologies", label: "Technologies" });
  if (vm.projects.length > 0) navItems.push({ id: "projects", label: "Projects" });
  if (vm.setups.length > 0) navItems.push({ id: "setup", label: "Setup" });
  if (vm.education.length > 0 || vm.languages.length > 0) {
    navItems.push({
      id: "background",
      label: vm.education.length > 0 ? "Education" : "Languages",
    });
  }
  if (hasContact) navItems.push({ id: "contact", label: "Contact" });

  // Alternate light-mode muted band backgrounds across visible sections after the hero.
  const sections: string[] = [renderHero(vm)];
  let bandIndex = 1;
  const pushSection = (builder: (muted: boolean) => string) => {
    const html = builder(bandIndex % 2 === 1);
    if (html) {
      sections.push(html);
      bandIndex++;
    }
  };

  pushSection((muted) => renderExperience(vm, muted));
  pushSection((muted) => renderTechnologies(vm, muted));
  pushSection((muted) => renderProjects(vm, muted));
  pushSection((muted) => renderSetup(vm, muted));
  pushSection((muted) => renderBackground(vm, muted));
  pushSection((muted) => renderContact(vm, muted));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script>
    (function () {
      try {
        var mode = localStorage.getItem("prezentme-portfolio-theme") || "system";
        var dark = mode === "dark" || (mode === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
        if (dark) document.documentElement.classList.add("dark");
      } catch (e) {}
    })();
  </script>
  <style>${PORTFOLIO_CSS}</style>
</head>
<body>
  ${renderHeader(navItems)}
  <main style="flex:1;display:flex;flex-direction:column;">
    ${sections.join("\n")}
  </main>
  <footer class="site-footer">
    <div class="container-wrapper footer-inner">
      <a href="https://prezentme.vercel.app" target="_blank" rel="noopener noreferrer" class="footer-link">
        <span>Built with</span>
        <span class="mono footer-brand">/prezent-me</span>
      </a>
    </div>
  </footer>
  <script>${PORTFOLIO_SCRIPT}</script>
</body>
</html>
`;
}
