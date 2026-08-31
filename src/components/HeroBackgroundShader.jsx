// Gradient "shader" hero background — the bake-off alternative to the photo
// cross-fade (see HeroBackground.jsx). Pure CSS: three oversized radial
// blobs in brand greens drifting on slow transform loops. Takes the same
// props contract as every background variant; it has no per-product frame,
// so it ignores products/activeIndex, and honours reducedMotion by freezing
// the drift.
export default function HeroBackgroundShader({ reducedMotion }) {
  const blob = (gradient, extra) => ({
    position: "absolute",
    width: "72%",
    aspectRatio: "1",
    borderRadius: "50%",
    background: gradient,
    filter: "blur(64px)",
    willChange: "transform",
    ...extra,
  });
  const anim = (name) => (reducedMotion ? "none" : `${name} 19s ease-in-out infinite`);
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
      <style>{`
        @keyframes hero-shader-a { 50% { transform: translate(9%, 11%) scale(1.14); } }
        @keyframes hero-shader-b { 50% { transform: translate(-11%, -7%) scale(1.1); } }
        @keyframes hero-shader-c { 50% { transform: translate(7%, -9%) scale(0.9); } }
      `}</style>
      <div style={blob("radial-gradient(circle at 35% 35%, #5A8A67 0%, rgba(90,138,103,0) 68%)", { top: "-20%", left: "-14%", animation: anim("hero-shader-a") })} />
      <div style={blob("radial-gradient(circle at 60% 40%, #2F5D43 0%, rgba(47,93,67,0) 66%)", { top: "-10%", right: "-18%", animation: anim("hero-shader-b") })} />
      <div style={blob("radial-gradient(circle at 50% 60%, #A8CDB2 0%, rgba(168,205,178,0) 70%)", { bottom: "-24%", left: "22%", animation: anim("hero-shader-c") })} />
    </div>
  );
}
