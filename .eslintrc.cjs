module.exports = {
  root: true,
  ignorePatterns: ["**/dist/**", "**/.next/**"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: { node: true, es2022: true, browser: true },
};



