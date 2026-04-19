"use client";

export default function CraneLogo({ size = 28 }) {
  return (
    <img
      src="/crane-logo.png"
      alt="ConstructionIQ"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
