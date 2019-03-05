const { transform, assign } = require("lodash");
const path = require("path");
const root = path.resolve(__dirname, '..', gruntConfig.src.ts);
const compilerOptions = require(path.join(root, 'tsconfig.json')).compilerOptions;
const pathmodify = require("pathmodify");

const makeConfig = debug => ({
  options: {
    transform: [
      [
        "envify",
        {
          NODE_ENV: debug ? "development" : "production"
        }
      ]
    ],
    plugin: [
      [
        "tsify",
        {
          project: root
        }
      ],
      // Modify paths because tsify does not fully support rewriting paths per
      // tsconfig.json's `paths` option.
      [
        "pathmodify",
        {
          mods: [
            pathmodify.mod.dir("front-end", root),
            pathmodify.mod.dir("shared", path.resolve(root, "../../shared"))
          ]
        }
      ]
    ],
    browserifyOptions: {
      debug,
      extensions: [".js", ".json", ".ts", ".tsx", ".jsx"]
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
