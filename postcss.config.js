const config = {
  plugins: {
    // To resolve path of an @import rule
    'postcss-import': {},
    // to edit target browsers: use "browserslist" field in package.json
    autoprefixer: {},
  },
};

if (process.env.NODE_ENV !== 'production') {
  config.plugins['postcss-discard-duplicates'] = {};
}

module.exports = config;
