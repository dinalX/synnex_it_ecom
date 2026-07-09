import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/sw.js",
      "tsconfig.tsbuildinfo",
      "prisma/dev.db",
    ],
  },
];

export default config;
