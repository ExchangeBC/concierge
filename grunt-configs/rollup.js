const { transform } = require("lodash");
const path = require("path");
const root = path.resolve(__dirname, "..", gruntConfig.src.ts);
const tsConfigPath = path.join(root, "tsconfig.json");
const compilerOptions = require(tsConfigPath).compilerOptions;
const typescript = require("rollup-plugin-typescript2");
const replace = require("rollup-plugin-replace");
const commonJs = require("rollup-plugin-commonjs");
const nodeResolve = require("rollup-plugin-node-resolve");
const json = require("rollup-plugin-json");
const builtins = require("rollup-plugin-node-builtins");
const globals = require("rollup-plugin-node-globals");

module.exports = {
  main: {
    options: {
      external: [],
      context: "this",
      output: {
        sourcmap: process.env.NODE_ENV === 'development',
      },
      plugins() {
        const tsOpts = {
          ...compilerOptions,
          baseUrl: root,
          paths: transform(compilerOptions.paths, (acc, v, k) => {
            acc[k] = v.map(p => path.resolve(root, p));
            return acc;
          }, {})
        };
        return [
          builtins(),
          json(),
          replace({
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
            "process.env.CONTACT_EMAIL": JSON.stringify(process.env.CONTACT_EMAIL)
          }),
          nodeResolve({
            mainFields: ["browser"],
            dedupe: ["react", "react-dom", "lodash"],
            preferBuiltins: false
          }),
          commonJs({
            include: "node_modules/**",
            namedExports: {
              "node_modules/lodash/lodash.js": [
                "set",
                "includes",
                "get",
                "cloneDeep",
                "find",
                "compact",
                "concat",
                "noop",
                "reduce",
                "isArray",
                "remove",
                "debounce",
                "isEqual",
                "isBoolean",
                "isEmpty"
              ],
              "node_modules/react/index.js": [
                "PureComponent",
                "Component",
                "createElement",
                "createContext",
                "forwardRef"
              ],
              "node_modules/react-dom/index.js": [
                "createPortal",
                "findDOMNode"
              ],
              "node_modules/immutable/dist/immutable.js": [
                "OrderedSet",
                "Set",
                "Record"
              ],
              "node_modules/tslib/tslib.js": [
                "__assign",
                "__awaiter",
                "__generator",
                "__extends"
              ]
            }
          }),
          globals(),
          typescript({ tsconfigOverride: { compilerOptions: tsOpts }})
        ];
      }
    },
    src: [
      `${gruntConfig.src.ts}/index.ts`
    ],
    dest: `${gruntConfig.out.js}`
  }
};
