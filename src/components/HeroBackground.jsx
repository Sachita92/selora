export default function HeroBackground({ products, activeIndex, reducedMotion }) {
  return (
    <>
      {products.map((p, i) => (
        <img
          key={p.bgImage}
          src={p.bgImage}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: p.bgPos,
            display: "block",
            opacity: i === activeIndex ? "var(--hero-img-opacity)" : 0,
            transition: reducedMotion ? "none" : "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: 0,
          }}
        />
      ))}
    </>
  );
}
