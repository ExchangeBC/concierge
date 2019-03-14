module.exports = {
  options: {
    interrupt: true,
    debounceDelay: 250
  },
  js: {
    files: [
      gruntConfig.out.js
    ],
    tasks: [
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
