module.exports = {
  options: {
    interrupt: true,
    debounceDelay: 250
  },
  ts: {
    files: [
      `${gruntConfig.src.ts}/**`
    ],
    tasks: [
      "browserify:development",
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
      "browserify:development",
      "compress"
    ]
  },
};
