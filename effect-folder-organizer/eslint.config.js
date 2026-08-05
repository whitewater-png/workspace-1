const premierepro = require("@adobe/eslint-plugin-premierepro");

module.exports = [
  premierepro.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        require: "readonly",
        module: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        Promise: "readonly",
      },
    },
  },
];
