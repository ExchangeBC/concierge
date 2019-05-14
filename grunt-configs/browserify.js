const { transform, assign } = require("lodash");
const path = require("path");
const root = path.resolve(__dirname, '..', gruntConfig.src.ts);
const compilerOptions = require(path.join(root, 'tsconfig.json')).compilerOptions;
const pathmodify = require("pathmodify");
const envify = require("envify/custom");

const makeConfig = debug => ({
  options: {
    configure(b) {
      return b
        .plugin('pathmodify', {
          mods: [
            pathmodify.mod.dir("front-end", root),
            pathmodify.mod.dir("shared", path.resolve(root, "../../shared"))
          ]
        })
        .plugin('tsify', { project: root })
        .transform(envify({
          NODE_ENV: debug ? 'development' : 'production'
        }), { global: true });
    },
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
