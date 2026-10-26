import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "git-vault — your media, stored in GitHub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TILES = [
  "linear-gradient(135deg,#1e1b4b,#6d4dff 55%,#22d3ee)",
  "linear-gradient(135deg,#f97316,#db2777 55%,#4c1d95)",
  "linear-gradient(135deg,#0f172a,#334155 55%,#94a3b8)",
  "linear-gradient(135deg,#ecfeff,#a5f3fc 55%,#0891b2)",
  "linear-gradient(135deg,#020617,#1e1b4b 55%,#312e81)",
  "linear-gradient(135deg,#4c1d95,#7c3aed 55%,#c084fc)",
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#07080b",
          color: "#edeff3",
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60rem 30rem at 10% -10%, rgba(124,92,255,0.35), transparent 60%), radial-gradient(40rem 24rem at 100% 10%, rgba(34,211,238,0.22), transparent 60%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 0 72px 72px", width: 660 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "linear-gradient(135deg,#7c5cff,#22d3ee)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  background: "rgba(7,8,11,0.88)",
                  transform: "rotate(45deg)",
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>git-vault</div>
          </div>
          <div style={{ marginTop: 40, fontSize: 70, fontWeight: 600, lineHeight: 1.02, letterSpacing: -2, display: "flex", flexDirection: "column" }}>
            <span>Your media,</span>
            <span style={{ color: "#a08cff" }}>stored in GitHub.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 25, lineHeight: 1.4, color: "#9aa1ae" }}>
            Free, versioned media storage that is just a repo you already own. Open source. Nothing stored on our servers.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: -40,
            top: 70,
            width: 560,
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            transform: "rotate(-6deg)",
          }}
        >
          {TILES.map((bg, i) => (
            <div
              key={i}
              style={{
                width: 164,
                height: 164,
                borderRadius: 22,
                background: bg,
                boxShadow: "0 30px 60px -20px rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
