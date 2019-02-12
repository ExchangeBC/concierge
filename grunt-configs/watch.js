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
      "browserify:development"
    ]
  },
  sass: {
    files: [
      `${gruntConfig.src.sass}/**`
    ],
    tasks: [
      "sass",
      "postcss:prefix"
    ]
  },
  static: {
    files: [
      `${gruntConfig.src.static}/**`
    ],
    tasks: [
      "common",
      "browserify:development"
    ]
  },
};
