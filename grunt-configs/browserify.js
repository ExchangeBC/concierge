const { transform, assign } = require("lodash");
const path = require("path");
const root = path.resolve(__dirname, '..', gruntConfig.src.ts);
const compilerOptions = require(path.join(root, 'tsconfig.json')).compilerOptions;
const pathmodify = require("pathmodify");

module.exports = {
  build: {
    options: {
      transform: [
        [
          "envify",
          {
            NODE_ENV: process.env.NODE_ENV === 'development' ? 'development' : 'production',
            CONTACT_EMAIL: process.env.CONTACT_EMAIL
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
        debug: process.env.NODE_ENV === 'development',
        extensions: [".js", ".json", ".ts", ".tsx", ".jsx"]
      }
    },
    src: [
      `${gruntConfig.src.ts}/index.ts`
    ],
    dest: `${gruntConfig.out.js}`
  }
};
