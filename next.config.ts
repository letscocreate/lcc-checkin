import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Este app é quase todo dinâmico (carteira, dados ao vivo da blockchain) —
  // o cache experimental de componentes não ajuda aqui e só criava
  // complexidade extra no build.
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
