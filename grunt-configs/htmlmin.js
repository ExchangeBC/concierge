const html = gruntConfig.out.html;
const index = `${html}/index.html`;
const notFound = `${html}/404.html`;

module.exports = {
  production: {
    options: {
      removeComments: true,
      collapseWhitespace: true,
      minifyJS: true,
      minifyCSS: true,
      collapseInlineTagWhitespace: true,
      caseSensitive: true,
      conservativeCollapse: true,
      keepClosingSlash: true
    },
    files: {
      [index]: index,
      [notFound]: notFound
    }
  }
};
