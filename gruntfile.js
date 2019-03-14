//set up global constants for all grunt tasks
const env = process.env.NODE_ENV || "development";
const src = "src/front-end";
const build = "build/front-end";
global.gruntConfig = {
  dir: {
    src,
    build
  },
  src: {
    "static": `${src}/static`,
    sass: `${src}/sass`,
    ts: `${src}/typescript`
  },
  out: {
    css: `${build}/app.css`,
    js: `${build}/app.js`,
    html: `${build}/`
  }
};

//dependencies
const loadTasks = require("load-grunt-tasks");
const requireDir = require("require-dir");
const _ = require("lodash");
const gruntConfigs = requireDir("./grunt-configs");

module.exports = function (grunt) {
  //load grunt tasks from package.json
  loadTasks(grunt);
  //initialize the grunt configs for various loaded tasks
  grunt.config.init(_.mapValues(gruntConfigs, v => {
    return _.isFunction(v) ? v(grunt) : v;
  }));
  //create task lists for dev and prod envs
  grunt.registerTask("common", [
    "clean:build",
    "copy:static",
    "sass",
    "postcss:prefix"
  ]);
  grunt.registerTask("development-build", [
    "common",
    "browserify:development",
    "compress"
  ]);
  grunt.registerTask("development-watch", [
    "development-build",
    "watch"
  ]);
  grunt.registerTask("production-build", [
    "common",
    "postcss:min",
    "browserify:production",
    "uglify:production",
    "htmlmin:production",
    "compress"
  ]);
  grunt.registerTask("build", [ `${env}-build` ]);
  grunt.registerTask("default", [ "development-watch" ]);
};
