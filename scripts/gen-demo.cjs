const sharp = require("sharp") // run with NODE_PATH=./node_modules from the repo root;
const fs = require("fs");
const path = require("path");
const out = path.join(process.cwd(), "public/demo");

const scene = (a, b, c, shapes, label) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>
    </linearGradient>
    <radialGradient id="r" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="40"/></filter>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <rect width="1200" height="800" fill="url(#r)"/>
  ${shapes}
  <text x="60" y="740" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" font-weight="600" fill="#fff" fill-opacity=".85" letter-spacing="2">${label}</text>
</svg>`;

const files = {
  "hero-banner.webp": scene("#1e1b4b", "#6d4dff", "#22d3ee",
    `<circle cx="900" cy="220" r="260" fill="#fff" fill-opacity=".12" filter="url(#blur)"/>
     <path d="M0 620 C 300 520, 500 720, 800 600 S 1100 520, 1200 560 V800 H0Z" fill="#07080b" fill-opacity=".35"/>
     <path d="M0 680 C 250 600, 550 760, 850 660 S 1100 620, 1200 650 V800 H0Z" fill="#07080b" fill-opacity=".45"/>`, "HERO BANNER · 1200×800"),
  "sunset-ridge.webp": scene("#f97316", "#db2777", "#4c1d95",
    `<circle cx="820" cy="300" r="120" fill="#fde68a" fill-opacity=".9"/>
     <path d="M0 560 L220 420 L380 520 L560 380 L760 540 L940 440 L1200 580 V800 H0Z" fill="#1e1b4b" fill-opacity=".8"/>
     <path d="M0 640 L180 560 L360 640 L600 520 L820 660 L1020 580 L1200 660 V800 H0Z" fill="#0f0a2a" fill-opacity=".9"/>`, "SUNSET RIDGE"),
  "studio-light.webp": scene("#0f172a", "#334155", "#94a3b8",
    `<ellipse cx="600" cy="420" rx="260" ry="260" fill="#fff" fill-opacity=".10" filter="url(#blur)"/>
     <rect x="420" y="300" width="360" height="240" rx="24" fill="#f8fafc" fill-opacity=".92"/>
     <rect x="460" y="340" width="280" height="14" rx="7" fill="#0f172a" fill-opacity=".35"/>
     <rect x="460" y="372" width="200" height="14" rx="7" fill="#0f172a" fill-opacity=".25"/>
     <rect x="460" y="470" width="120" height="36" rx="18" fill="#6d4dff"/>`, "STUDIO LIGHT"),
  "product-shot.webp": scene("#ecfeff", "#a5f3fc", "#0891b2",
    `<rect x="300" y="190" width="600" height="420" rx="36" fill="#0b0d12"/>
     <rect x="330" y="220" width="540" height="340" rx="22" fill="url(#g)"/>
     <rect x="520" y="620" width="160" height="16" rx="8" fill="#0b0d12" fill-opacity=".5"/>`, "PRODUCT SHOT"),
  "city-night.webp": scene("#020617", "#1e1b4b", "#312e81",
    `${Array.from({length: 18}).map((_, i) => `<rect x="${i*68}" y="${380 + ((i*97)%260)}" width="52" height="${420 - ((i*97)%260)}" fill="#0b0d12"/>`).join("")}
     ${Array.from({length: 90}).map((_, i) => `<rect x="${(i*53)%1190}" y="${420 + ((i*37)%340)}" width="6" height="9" fill="#fde68a" fill-opacity="${0.4 + (i%5)/8}"/>`).join("")}
     <circle cx="980" cy="160" r="60" fill="#f1f5f9" fill-opacity=".9"/>`, "CITY NIGHT"),
  "paper-texture.webp": scene("#fef3c7", "#fde68a", "#fbbf24",
    `${Array.from({length: 40}).map((_, i) => `<line x1="0" y1="${i*22}" x2="1200" y2="${i*22+9}" stroke="#92400e" stroke-opacity=".08"/>`).join("")}
     <rect x="120" y="120" width="960" height="560" rx="8" fill="#fffbeb" fill-opacity=".7"/>`, "PAPER TEXTURE"),
  "blog/cover-launch.webp": scene("#4c1d95", "#7c3aed", "#c084fc",
    `<circle cx="300" cy="400" r="180" fill="#fff" fill-opacity=".15"/><circle cx="420" cy="400" r="180" fill="#fff" fill-opacity=".15"/><circle cx="540" cy="400" r="180" fill="#fff" fill-opacity=".15"/>`, "BLOG · LAUNCH"),
  "blog/cover-roadmap.webp": scene("#064e3b", "#059669", "#6ee7b7",
    `<path d="M100 600 Q 400 200 700 500 T 1100 300" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="14" stroke-dasharray="30 24"/>
     <circle cx="100" cy="600" r="22" fill="#fff"/><circle cx="700" cy="500" r="22" fill="#fff"/><circle cx="1100" cy="300" r="22" fill="#fff"/>`, "BLOG · ROADMAP"),
};

const svgs = {
  "brand/logo.svg": fs.readFileSync("app/icon.svg", "utf8"),
  "brand/wordmark.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="96" viewBox="0 0 420 96"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><rect x="8" y="16" width="64" height="64" rx="16" fill="url(#g)"/><path d="M40 29l5.2 13.8L59 48l-13.8 5.2L40 67l-5.2-13.8L21 48l13.8-5.2L40 29Z" fill="#07080b" fill-opacity=".88"/><text x="92" y="64" font-family="Inter, Helvetica, Arial, sans-serif" font-size="44" font-weight="600" fill="#14161b" letter-spacing="-1">git-vault</text></svg>`,
};
const texts = {
  "brand/palette.json": JSON.stringify({ iris: "#6d4dff", aqua: "#0891b2", lime: "#15803d", rose: "#e11d48", amber: "#b45309", ink: "#14161b" }, null, 2) + "\n",
  "notes.md": "# Demo bucket\n\nThese files live in the git-vault repository under `public/demo`.\nEvery one of them has a permanent raw.githubusercontent.com URL — that's the whole idea.\n\n- Drop files to upload (each upload is a commit)\n- Click a folder to open it\n- Hover a tile and copy its link\n",
};

(async () => {
  for (const [name, svg] of Object.entries(files)) {
    await sharp(Buffer.from(svg)).webp({ quality: 78 }).toFile(path.join(out, name));
  }
  for (const [name, svg] of Object.entries(svgs)) fs.writeFileSync(path.join(out, name), svg);
  for (const [name, t] of Object.entries(texts)) fs.writeFileSync(path.join(out, name), t);

  const walk = (dir, rel = "") => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = rel ? `${rel}/${d.name}` : d.name;
    if (d.isDirectory()) return [{ path: p, name: d.name, type: "dir", size: 0 }, ...walk(path.join(dir, d.name), p)];
    return [{ path: p, name: d.name, type: "file", size: fs.statSync(path.join(dir, d.name)).size }];
  });
  const manifest = walk(out);
  fs.writeFileSync("components/landing/demo-manifest.json", JSON.stringify(manifest, null, 2) + "\n");
  console.log(manifest.map((m) => `${m.type.padEnd(4)} ${String(m.size).padStart(7)}  ${m.path}`).join("\n"));
  const total = manifest.reduce((s, m) => s + m.size, 0);
  console.log("total bytes:", total);
})();
