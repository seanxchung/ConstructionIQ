"use client";

export default function CraneLogo({ size = 28 }) {
  return (
    <img
      src="/crane-logo.png"
      alt="ConstructIQ"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
