const makeConfig = debug => ({
  options: {
    plugin: [
      [
        "tsify",
        {
          project: gruntConfig.src.ts
        }
      ]
    ],
    browserifyOptions: {
      debug
    }
  },
  src: [
    `${gruntConfig.src.ts}/index.ts`
  ],
  dest: `${gruntConfig.out.js}`
});

module.exports = {
  development: makeConfig(true),
  production: makeConfig(false)
};
