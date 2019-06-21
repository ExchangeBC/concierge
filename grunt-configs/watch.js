module.exports = {
  options: {
    interrupt: true,
    debounceDelay: 250
  },
  js: {
    files: [
      `${gruntConfig.src.ts}/**`,
      `${gruntConfig.src.tsShared}/**`
    ],
    tasks: [
      "rollup",
      "compress"
    ]
  },
  sass: {
    files: [
      `${gruntConfig.src.sass}/**`
    ],
    tasks: [
      "sass",
      "postcss:prefix",
      "compress"
    ]
  },
  static: {
    files: [
      `${gruntConfig.src.static}/**`
    ],
    tasks: [
      "common",
      "rollup",
      "compress"
    ]
  },
};
