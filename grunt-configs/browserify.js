const makeConfig = debug => ({
  options: {
    debug,
    transform: [
      [
        "babelify",
        {
          sourceMaps: debug,
          presets: [ "@babel/preset-env", "@babel/preset-react" ]
        }
      ]
    ]
  },
  src: [
    `${gruntConfig.src.js}/index.js`
  ],
  dest: `${gruntConfig.out.js}`
});

module.exports = {
  development: makeConfig(true),
  production: makeConfig(false)
};
