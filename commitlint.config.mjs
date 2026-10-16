/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow a slightly longer header for descriptive scaffolding commits.
    "header-max-length": [2, "always", 100],
    "scope-enum": [
      2,
      "always",
      [
        "setup",
        "ui",
        "layout",
        "theme",
        "domain",
        "rbac",
        "auth",
        "stripe",
        "video",
        "config",
        "deps",
        "test",
        "docs",
        "release",
      ],
    ],
  },
};

export default config;
