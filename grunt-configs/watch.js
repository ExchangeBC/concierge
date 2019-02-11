module.exports = {
  options: {
    interrupt: true,
    debounceDelay: 250
  },
  js: {
    files: [
      `${gruntConfig.src.js}/**`,
      `${gruntConfig.src.sass}/**`,
      `${gruntConfig.src.static}/**`,
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
