export const marketingSiteCss = `:root {
  --ink: #12100d;
  --ink-strong: #080706;
  --paper: #e7dcc8;
  --paper-strong: #f3ead8;
  --paper-muted: #c4b49b;
  --text: #171410;
  --text-soft: rgba(23, 20, 16, 0.72);
  --text-strong: #f8f1e2;
  --text-strong-soft: rgba(248, 241, 226, 0.74);
  --line: rgba(23, 20, 16, 0.16);
  --line-strong: rgba(23, 20, 16, 0.3);
  --dark-line: rgba(248, 241, 226, 0.18);
  --dark-line-strong: rgba(248, 241, 226, 0.34);
  --accent: #df492d;
  --accent-strong: #ff6a45;
  --steel: #7e8388;
  --focus-surface: #ff6a45;
  --focus-text: #080706;
  --focus-ring: #080706;
  --focus-shadow: #f3ead8;
  --content-width: min(1240px, calc(100vw - 48px));
  --display:
    "Helvetica Neue Condensed",
    "Arial Narrow",
    "Nimbus Sans Narrow",
    "Liberation Sans Narrow",
    sans-serif;
  --sans:
    "Avenir Next",
    "Helvetica Neue",
    "Segoe UI",
    sans-serif;
  --mono:
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Courier New",
    monospace;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    linear-gradient(
      90deg,
      transparent 0,
      transparent calc(50% - 1px),
      rgba(23, 20, 16, 0.06) calc(50% - 1px),
      rgba(23, 20, 16, 0.06) calc(50% + 1px),
      transparent calc(50% + 1px)
    ),
    repeating-linear-gradient(
      180deg,
      rgba(23, 20, 16, 0.03) 0 1px,
      transparent 1px 72px
    ),
    var(--paper);
  color: var(--text);
  font-family: var(--sans);
}

a {
  color: inherit;
}

a:focus-visible {
  outline: 0;
  color: var(--focus-text);
  background: var(--focus-surface);
  box-shadow:
    0 0 0 2px var(--focus-ring),
    4px 4px 0 0 var(--focus-shadow);
}

a:focus:not(:focus-visible) {
  box-shadow: none;
}

p,
li,
dd,
dt {
  margin: 0;
}

code {
  font-family: var(--mono);
  font-size: 0.82rem;
  word-break: break-word;
}

.site-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 20;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: end;
  padding: 18px 24px 16px;
  background: rgba(18, 16, 13, 0.96);
  border-bottom: 2px solid var(--accent);
}

.brand {
  display: grid;
  gap: 2px;
  text-decoration: none;
}

.brand-mark {
  color: var(--text-strong);
  font-family: var(--display);
  font-size: 1.82rem;
  font-weight: 900;
  letter-spacing: -0.11em;
  line-height: 0.82;
  text-transform: uppercase;
}

.brand-meta {
  color: var(--text-strong-soft);
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.site-header nav {
  display: flex;
  flex-wrap: wrap;
  justify-self: end;
  gap: 12px 18px;
}

.site-header nav a {
  color: var(--text-strong-soft);
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    color 140ms ease,
    transform 140ms ease;
}

.site-header nav a:hover {
  color: var(--accent-strong);
  transform: translateY(-2px);
}

.brand:focus-visible,
.site-header nav a:focus-visible,
.button-primary:focus-visible,
.button-secondary:focus-visible {
  transform: translate(4px, -4px);
}

main {
  overflow: clip;
}

.hero {
  --section-text: var(--text-strong);
  --section-muted: var(--text-strong-soft);
  --section-line: var(--dark-line);
  --section-line-strong: var(--dark-line-strong);
  --focus-ring: var(--paper);
  --focus-shadow: rgba(248, 241, 226, 0.9);
  position: relative;
  padding: 96px 0 0;
  background:
    linear-gradient(180deg, rgba(223, 73, 45, 0.08), transparent 16%),
    repeating-linear-gradient(
      180deg,
      rgba(248, 241, 226, 0.04) 0 1px,
      transparent 1px 84px
    ),
    var(--ink);
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: min(14vw, 148px);
  background:
    linear-gradient(180deg, var(--accent) 0 94px, transparent 94px),
    linear-gradient(180deg, rgba(223, 73, 45, 0.14), transparent 46%);
}

.hero::after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 2px;
  background:
    linear-gradient(
      90deg,
      transparent,
      var(--accent) 24%,
      var(--paper) 24% 76%,
      var(--accent) 76%,
      transparent
    );
}

.hero-shell {
  width: min(1400px, calc(100vw - 48px));
  margin: 0 auto;
  min-height: calc(100svh - 96px);
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 36px;
  align-items: stretch;
  padding: 42px 0 56px;
}

.section {
  --section-text: var(--text);
  --section-muted: var(--text-soft);
  --section-line: var(--line);
  --section-line-strong: var(--line-strong);
  position: relative;
  width: var(--content-width);
  margin: 0 auto;
  padding: 90px 0;
}

.cta-section {
  --section-text: var(--text-strong);
  --section-muted: var(--text-strong-soft);
  --section-line: var(--dark-line);
  --section-line-strong: var(--dark-line-strong);
  --focus-ring: var(--paper);
  --focus-shadow: rgba(248, 241, 226, 0.9);
  position: relative;
  padding: 96px 0 120px;
  background:
    linear-gradient(180deg, rgba(223, 73, 45, 0.08), transparent 24%),
    repeating-linear-gradient(
      180deg,
      rgba(248, 241, 226, 0.04) 0 1px,
      transparent 1px 72px
    ),
    var(--ink);
}

.cta-section::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: var(--accent);
}

.section[data-section]::before,
.cta-section[data-section]::after {
  content: attr(data-section);
  position: absolute;
  top: 18px;
  right: 0;
  color: rgba(223, 73, 45, 0.18);
  font-family: var(--display);
  font-size: clamp(3rem, 8vw, 6.6rem);
  font-weight: 900;
  letter-spacing: -0.14em;
  line-height: 0.8;
}

.proof-section {
  padding-top: 96px;
}

.eyebrow,
.step-index {
  margin: 0;
  color: var(--section-muted);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero .eyebrow,
.cta-section .eyebrow {
  color: var(--accent-strong);
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--section-text);
  font-family: var(--display);
  font-weight: 900;
  letter-spacing: -0.09em;
  line-height: 0.88;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(3.8rem, 7vw, 7.2rem);
  max-width: 8ch;
}

h2 {
  font-size: clamp(2.7rem, 4.8vw, 5rem);
  max-width: 10ch;
}

h3 {
  font-size: clamp(1.5rem, 2.35vw, 2.45rem);
}

.lede,
.hero-note,
.section-copy,
.support-lead,
.bullet-list li,
.listing-row p,
.comparison-row p,
.workflow-step p,
.audit-line p,
.metric-band-item p,
.system-module p,
.system-facts dd,
.comparison-row dd,
.comparison-row dt {
  line-height: 1.68;
}

.hero-copy {
  position: relative;
  display: grid;
  align-content: center;
  max-width: 38rem;
  padding: 24px 0 0 24px;
  border-left: 4px solid var(--accent);
}

.hero-brand {
  margin-top: 10px;
  color: var(--paper-strong);
  font-size: clamp(7rem, 19vw, 14rem);
  font-weight: 900;
  letter-spacing: -0.14em;
  line-height: 0.72;
  text-transform: uppercase;
}

.hero-headline {
  margin-top: 16px;
}

.lede {
  margin-top: 20px;
  max-width: 34ch;
  color: var(--section-muted);
  font-size: 1.04rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 30px;
}

.button-primary,
.button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  padding: 0 26px;
  border: 2px solid currentColor;
  border-radius: 0;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    transform 140ms ease,
    background-color 140ms ease,
    color 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.button-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--ink-strong);
}

.button-secondary {
  background: transparent;
  border-color: var(--paper-muted);
  color: var(--text-strong);
}

.button-primary:hover,
.button-secondary:hover {
  transform: translate(4px, -4px);
}

.button-secondary:hover {
  border-color: var(--accent-strong);
  color: var(--accent-strong);
}

.hero-note {
  margin-top: 18px;
  max-width: 42ch;
  color: var(--section-muted);
}

.hero-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin-top: 32px;
  border-top: 2px solid var(--paper);
  border-bottom: 1px solid var(--section-line);
}

.hero-facts div {
  display: grid;
  gap: 8px;
  padding: 16px 16px 16px 0;
  border-right: 1px solid var(--section-line);
}

.hero-facts div:last-child {
  border-right: 0;
}

.hero-facts span,
.hero-stage-footer span,
.hero-manifest-line span {
  color: var(--section-muted);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-facts strong {
  color: var(--paper-strong);
  font-family: var(--display);
  font-size: 1.58rem;
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 0.92;
  text-transform: uppercase;
}

.hero-stage {
  position: relative;
  min-height: 720px;
  overflow: hidden;
  border: 2px solid var(--paper);
  background:
    linear-gradient(180deg, rgba(248, 241, 226, 0.03), transparent 42%),
    var(--ink-strong);
}

.hero-stage::before {
  content: "Live board";
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  padding: 10px 16px;
  background: var(--accent);
  color: var(--ink-strong);
  font-family: var(--mono);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-stage-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(248, 241, 226, 0.1) 2px, transparent 2px),
    linear-gradient(90deg, rgba(248, 241, 226, 0.08) 2px, transparent 2px),
    linear-gradient(90deg, rgba(223, 73, 45, 0.28) 0 2px, transparent 2px),
    linear-gradient(rgba(223, 73, 45, 0.18) 0 2px, transparent 2px);
  background-size:
    96px 96px,
    96px 96px,
    320px 100%,
    100% 248px;
  background-position:
    0 0,
    0 0,
    72% 0,
    0 70%;
  opacity: 0.46;
}

.hero-stage-map {
  position: absolute;
  left: 17%;
  top: 14%;
  width: 58%;
  aspect-ratio: 1.34;
  border: 2px solid var(--paper-muted);
  background:
    repeating-linear-gradient(
      135deg,
      rgba(248, 241, 226, 0.1) 0 12px,
      rgba(248, 241, 226, 0.02) 12px 24px
    ),
    linear-gradient(135deg, rgba(223, 73, 45, 0.14), rgba(223, 73, 45, 0) 68%);
  clip-path: polygon(
    8% 46%,
    12% 34%,
    24% 24%,
    40% 19%,
    58% 18%,
    74% 23%,
    88% 32%,
    95% 48%,
    90% 61%,
    78% 71%,
    62% 77%,
    40% 80%,
    22% 74%,
    11% 62%
  );
  transform: rotate(-6deg);
}

.hero-stage-map::before,
.hero-stage-map::after {
  content: "";
  position: absolute;
  inset: 0;
}

.hero-stage-map::before {
  background:
    linear-gradient(
      90deg,
      transparent 0 63%,
      rgba(223, 73, 45, 0.56) 63% 64%,
      transparent 64% 100%
    ),
    linear-gradient(
      180deg,
      transparent 0 44%,
      rgba(223, 73, 45, 0.44) 44% 45%,
      transparent 45% 100%
    );
}

.hero-stage-map::after {
  inset: 16% 18% 14% 14%;
  border: 2px solid rgba(223, 73, 45, 0.7);
}

.hero-stage-region,
.hero-stage-manifest,
.hero-stage-footer,
.hero-point {
  position: absolute;
  z-index: 1;
}

.hero-stage-region {
  top: 26px;
  left: 28px;
  padding: 8px 12px;
  background: var(--paper);
  color: var(--ink-strong);
  font-family: var(--mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-stage-manifest,
.hero-stage-footer {
  width: min(360px, calc(100% - 56px));
  padding: 20px;
  border: 2px solid var(--paper);
  background: rgba(8, 7, 6, 0.92);
}

.hero-stage-manifest {
  left: 28px;
  bottom: 28px;
}

.hero-manifest-line {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid var(--section-line);
}

.hero-manifest-line strong,
.hero-manifest-line code {
  color: var(--paper-strong);
  font-weight: 700;
  line-height: 1.42;
}

.hero-stage-points {
  position: absolute;
  inset: 0;
}

.hero-point {
  display: grid;
  gap: 6px;
  min-width: 0;
  max-width: 190px;
  padding-left: 20px;
}

.hero-point::before,
.hero-point::after {
  content: "";
  position: absolute;
}

.hero-point::before {
  left: 0;
  top: 11px;
  width: 12px;
  height: 12px;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(223, 73, 45, 0.16);
}

.hero-point::after {
  left: 12px;
  top: 17px;
  width: 48px;
  height: 1px;
  background: rgba(223, 73, 45, 0.78);
}

.hero-point p,
.hero-point span {
  margin: 0;
}

.hero-point p {
  color: var(--section-muted);
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-point span {
  color: var(--paper-strong);
  font-family: var(--display);
  font-size: 1.46rem;
  font-weight: 900;
  letter-spacing: -0.07em;
  line-height: 0.92;
  text-transform: uppercase;
}

.hero-point-1 {
  top: 26%;
  right: 10%;
}

.hero-point-2 {
  top: 45%;
  right: 22%;
}

.hero-point-3 {
  top: 61%;
  right: 8%;
}

.hero-stage-footer {
  top: 88px;
  right: 28px;
}

.hero-stage-footer h2 {
  margin-top: 12px;
  max-width: 8ch;
  color: var(--paper-strong);
  font-size: clamp(2.3rem, 3vw, 3.4rem);
}

.hero-stage-footer p:last-of-type {
  margin-top: 14px;
  color: var(--section-muted);
}

.hero-stage-footer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--section-line);
}

.hero-stage-footer-grid div {
  display: grid;
  gap: 6px;
}

.hero-stage-footer strong {
  color: var(--paper-strong);
  font-family: var(--display);
  font-size: 1.28rem;
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 0.92;
  text-transform: uppercase;
}

.section-heading {
  display: grid;
  gap: 14px;
  max-width: 64rem;
  padding-top: 18px;
  border-top: 2px solid var(--section-line-strong);
}

.section-copy {
  max-width: 46ch;
  color: var(--section-muted);
}

.support-section {
  display: grid;
  gap: 32px;
}

.support-summary,
.contrast-grid,
.cta-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 28px;
}

.support-summary {
  padding-top: 20px;
  border-top: 1px solid var(--section-line);
}

.support-lead {
  max-width: 43ch;
  font-size: 1.05rem;
}

.support-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-left: 1px solid var(--section-line);
}

.support-metrics div {
  display: grid;
  gap: 8px;
  padding-left: 16px;
  border-right: 1px solid var(--section-line);
}

.support-metrics div:last-child {
  border-right: 0;
}

.support-metrics span,
.system-facts dt,
.listing-topline span,
.listing-actions span,
.comparison-header span {
  color: var(--section-muted);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.support-metrics strong {
  color: var(--section-text);
  font-family: var(--display);
  font-size: 1.68rem;
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 0.92;
  text-transform: uppercase;
}

.contrast-grid {
  gap: 24px;
}

.contrast-panel {
  display: grid;
  gap: 18px;
  padding-top: 24px;
  border-top: 2px solid var(--section-line-strong);
}

.contrast-panel-accent {
  border-top-color: var(--accent);
}

.bullet-list,
.comparison-meta {
  margin: 0;
  padding: 0;
  list-style: none;
}

.bullet-list {
  counter-reset: item;
  display: grid;
  gap: 0;
}

.bullet-list li {
  position: relative;
  padding: 16px 0 0 42px;
  margin-top: 16px;
  border-top: 1px solid var(--section-line);
  color: var(--section-muted);
}

.bullet-list li::before {
  content: counter(item, decimal-leading-zero);
  counter-increment: item;
  position: absolute;
  left: 0;
  top: 12px;
  color: var(--accent);
  font-family: var(--display);
  font-size: 1.14rem;
  font-weight: 900;
  letter-spacing: -0.08em;
}

.system-grid {
  margin-top: 32px;
  border-top: 2px solid var(--section-line-strong);
}

.system-module {
  display: grid;
  grid-template-columns: minmax(118px, 0.2fr) minmax(0, 0.95fr) minmax(260px, 0.85fr);
  gap: 24px;
  align-items: start;
  padding: 28px 0;
  border-bottom: 1px solid var(--section-line);
}

.system-module-copy,
.system-module-proof {
  display: grid;
  gap: 12px;
}

.system-module-label .eyebrow {
  color: var(--accent);
}

.system-module-copy p {
  color: var(--section-muted);
}

.system-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
  margin: 0;
}

.system-facts div {
  display: grid;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--section-line);
}

.system-facts dd {
  margin: 0;
}

.system-facts a {
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}

.municipality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-top: 34px;
}

.municipality-band {
  display: grid;
  gap: 8px;
  padding-top: 18px;
  border-top: 2px solid var(--section-line-strong);
}

.municipality-band h3 {
  font-size: clamp(1.7rem, 2vw, 2.2rem);
}

.municipality-band p:last-child,
.municipality-band p:nth-of-type(2) {
  color: var(--section-muted);
}

.proof-body {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(280px, 0.82fr);
  gap: 32px;
  margin-top: 40px;
}

.listing-grid,
.comparison-grid {
  border-top: 2px solid var(--section-line-strong);
}

.listing-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1.2fr) minmax(220px, 0.82fr);
  gap: 18px;
  align-items: start;
  padding: 20px 0;
  border-bottom: 1px solid var(--section-line);
  transition:
    transform 140ms ease,
    background-color 140ms ease,
    border-color 140ms ease;
}

.listing-row:hover {
  transform: translateX(6px);
  background: rgba(223, 73, 45, 0.05);
  border-color: rgba(223, 73, 45, 0.44);
}

.listing-index {
  min-width: 54px;
  color: var(--accent);
  font-family: var(--display);
  font-size: 2.4rem;
  font-weight: 900;
  letter-spacing: -0.09em;
  line-height: 0.84;
}

.listing-copy,
.listing-proof {
  display: grid;
  gap: 10px;
}

.listing-topline,
.listing-actions,
.comparison-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
  align-items: center;
}

.listing-summary,
.comparison-subject-summary {
  color: var(--section-muted);
}

.audit-path {
  display: grid;
  gap: 6px;
}

.audit-path span {
  color: var(--section-muted);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.audit-path code,
.audit-line code {
  display: block;
  padding: 10px 12px;
  background: var(--paper-strong);
  border: 1px solid var(--section-line);
}

.cta-section .audit-line code {
  background: rgba(248, 241, 226, 0.06);
  border-color: var(--section-line);
}

.listing-actions,
.subject-actions {
  font-size: 0.92rem;
}

.listing-actions a,
.subject-actions a,
.audit-line a {
  text-decoration: none;
  border-bottom: 1px solid currentColor;
  transition:
    color 140ms ease,
    background-color 140ms ease,
    box-shadow 140ms ease;
}

.subject-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.subject-rail {
  position: sticky;
  top: 96px;
  align-self: start;
  display: grid;
  gap: 16px;
  padding: 22px 0 0 20px;
  border-left: 3px solid var(--accent);
}

.subject-note {
  color: var(--section-muted);
}

.subject-metrics {
  display: grid;
  gap: 14px;
}

.metric-band-item {
  display: grid;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--section-line);
}

.metric-band-item h3 {
  font-size: clamp(1.7rem, 2vw, 2.1rem);
}

.comparison-grid {
  display: grid;
  gap: 0;
  margin-top: 36px;
}

.comparison-row {
  padding: 20px 0;
  border-bottom: 1px solid var(--section-line);
}

.comparison-body {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(220px, 0.9fr);
  gap: 18px;
}

.comparison-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 12px;
}

.comparison-meta li {
  padding-top: 10px;
  border-top: 1px solid var(--section-line);
}

.comparison-row dl {
  margin: 0;
}

.comparison-row dl div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--section-line);
}

.comparison-row dd {
  text-align: right;
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  margin-top: 34px;
  padding-top: 18px;
  border-top: 2px solid var(--section-line-strong);
}

.workflow-step {
  display: grid;
  gap: 12px;
}

.step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 32px;
  padding: 4px 12px;
  background: var(--accent);
  color: var(--ink-strong);
  font-weight: 800;
}

.workflow-step p:last-child {
  color: var(--section-muted);
}

.cta-panel {
  width: var(--content-width);
  margin: 0 auto;
  gap: 36px;
  padding-top: 24px;
  border-top: 2px solid var(--section-line-strong);
}

.cta-copy,
.cta-audit {
  display: grid;
  gap: 14px;
}

.cta-copy p:not(.eyebrow):not(.hero-note) {
  max-width: 38ch;
  color: var(--section-muted);
}

.cta-audit {
  align-content: start;
}

.audit-line {
  display: grid;
  gap: 8px;
  padding: 18px 0;
  border-bottom: 1px solid var(--section-line);
}

.reveal {
  opacity: 0;
  transform: translateY(20px);
}

@media (prefers-reduced-motion: no-preference) {
  .reveal {
    animation: snap-in 460ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  .hero-stage-grid {
    animation: grid-shift 14s linear infinite;
  }

  .hero-stage-map {
    animation: map-nudge 8s steps(2, end) infinite;
  }

  .reveal-1 {
    animation-delay: 40ms;
  }

  .reveal-2 {
    animation-delay: 90ms;
  }

  .reveal-3 {
    animation-delay: 140ms;
  }

  .reveal-4 {
    animation-delay: 190ms;
  }
}

@keyframes snap-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes grid-shift {
  0% {
    background-position:
      0 0,
      0 0,
      72% 0,
      0 70%;
  }

  50% {
    background-position:
      -18px 12px,
      -18px 12px,
      72% 0,
      0 70%;
  }

  100% {
    background-position:
      0 0,
      0 0,
      72% 0,
      0 70%;
  }
}

@keyframes map-nudge {
  0%,
  100% {
    transform: rotate(-6deg) translate3d(0, 0, 0);
  }

  50% {
    transform: rotate(-6deg) translate3d(6px, -4px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .reveal {
    opacity: 1;
    transform: none;
  }

  .hero-stage-grid,
  .hero-stage-map {
    animation: none;
  }

  .site-header nav a,
  .button-primary,
  .button-secondary,
  .listing-row {
    transition: none;
  }

  .site-header nav a:hover,
  .button-primary:hover,
  .button-secondary:hover,
  .brand:focus-visible,
  .site-header nav a:focus-visible,
  .button-primary:focus-visible,
  .button-secondary:focus-visible,
  .listing-row:hover {
    transform: none;
  }
}

@media (max-width: 1120px) {
  .hero-shell,
  .support-summary,
  .contrast-grid,
  .proof-body,
  .cta-panel {
    grid-template-columns: 1fr;
  }

  .hero-shell {
    min-height: auto;
  }

  .hero-stage {
    min-height: 680px;
  }

  .system-module {
    grid-template-columns: minmax(120px, 0.22fr) minmax(0, 1fr);
  }

  .system-module-proof {
    grid-column: 2;
  }

  .subject-rail {
    position: static;
    padding: 18px 0 0;
    border-left: 0;
    border-top: 3px solid var(--accent);
  }
}

@media (max-width: 820px) {
  :root {
    --content-width: min(1240px, calc(100vw - 32px));
  }

  .site-header {
    grid-template-columns: 1fr;
    align-items: start;
    padding: 16px;
  }

  .site-header nav {
    justify-self: start;
  }

  .hero {
    padding-top: 132px;
  }

  .hero-shell {
    width: min(1400px, calc(100vw - 32px));
  }

  .hero-facts,
  .support-metrics,
  .workflow-grid,
  .system-facts,
  .comparison-body,
  .listing-row {
    grid-template-columns: 1fr;
  }

  .hero-facts div,
  .support-metrics div {
    padding-left: 0;
    padding-right: 0;
    border-right: 0;
    border-top: 1px solid var(--section-line);
  }

  .hero-facts,
  .support-metrics {
    border-left: 0;
    border-bottom: 1px solid var(--section-line);
  }

  .hero-stage {
    min-height: auto;
    display: grid;
    gap: 18px;
    padding: 68px 24px 24px;
  }

  .hero-stage-region,
  .hero-stage-manifest,
  .hero-stage-footer {
    position: relative;
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
    width: auto;
    max-width: none;
  }

  .hero-stage-points {
    position: relative;
    inset: auto;
    display: grid;
    gap: 16px;
  }

  .hero-point {
    position: relative;
    top: auto;
    right: auto;
    left: auto;
    max-width: none;
  }

  .hero-stage-map {
    left: 44%;
    top: 18%;
    width: 52%;
    opacity: 0.24;
  }

  .proof-section {
    padding-top: 82px;
  }

  .system-module-proof {
    grid-column: auto;
  }
}

@media (max-width: 620px) {
  :root {
    --content-width: min(1240px, calc(100vw - 24px));
  }

  .hero-shell {
    width: min(1400px, calc(100vw - 24px));
  }

  .hero-copy {
    padding-left: 18px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .button-primary,
  .button-secondary {
    width: 100%;
  }

  .section,
  .cta-section {
    padding-top: 76px;
  }

  .cta-section {
    padding-bottom: 96px;
  }

  .section[data-section]::before,
  .cta-section[data-section]::after {
    top: 22px;
    font-size: clamp(2.2rem, 18vw, 4rem);
  }

  .hero-stage {
    padding: 68px 18px 18px;
  }

  .hero-stage-footer-grid {
    grid-template-columns: 1fr;
  }

  .comparison-row dl div {
    grid-template-columns: 1fr;
  }

  .listing-actions,
  .subject-actions {
    justify-content: flex-start;
  }

  h1 {
    font-size: clamp(3.2rem, 17vw, 5.4rem);
  }

  .hero-brand {
    font-size: clamp(5.8rem, 24vw, 8.8rem);
  }
}`;
