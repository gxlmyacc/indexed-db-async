const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const ESLintPlugin = require('eslint-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const errorOverlayMiddleware = require('./errorOverlayMiddleware');
const { getCurrentTime, ignoredFiles } = require('./utils');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const srcDir = path.join(rootDir, 'demo');
const publicDir = path.join(rootDir, 'public');
const isWatch = Boolean(process.env.WATCH_MODE);
const publicPath = '/';

const pkg = require(path.join(rootDir, 'package.json'));

if (!process.env.NODE_ENV) process.env.NODE_ENV = ['production', 'development'][1];

const cssRegex = /\.css$/;
const sassRegex = /\.s[ac]ss$/;
// common function to get style loaders
const getStyleLoaders = (cssOptions, preProcessor, preOptions) => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {

      },
    },
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      loader: require.resolve('babel-preset-react-scope-style/loader'),
      options: {}
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: require.resolve('postcss-loader'),
      options: {
        sourceMap: true,
        // config: true
      },
    },
  ].filter(Boolean);
  if (preProcessor) {
    loaders.push({
      loader: require.resolve(preProcessor),
      options: { sourceMap: true, ...preOptions },
    });
  }
  return loaders;
};

const devServerOpt = {
  hot: isWatch,
  headers: { 'Access-Control-Allow-Origin': '*' },
  historyApiFallback: false,
  compress: true,
  host: '0.0.0.0',
  port: process.env.PORT || 8080,
  allowedHosts: 'all',
  client: {
    overlay: false,
    logging: 'none',
  },
  static: {
    directory: distDir,
    publicPath,
    watch: {
      ignored: ignoredFiles(srcDir),
    },
  },
  onBeforeSetupMiddleware(server) {
    const { app } = server;
    // This lets us fetch source contents from webpack for the error overlay
    app.use(evalSourceMapMiddleware(server));
    // This lets us open files from the runtime error overlay.
    app.use(errorOverlayMiddleware());
  },
};

const config = {
  devtool: 'eval-source-map',
  entry: {
    index: path.join(srcDir, 'index')
  },
  mode: process.env.NODE_ENV,
  output: {
    publicPath,
    filename: 'assets/[name]-[contenthash:5].js',
    chunkFilename: 'assets/[name]-[contenthash:5].js',
  },
  resolve: {
    extensions: ['.jsx', '.js', '.ts', '.tsx', '.vue', '.json'],
    alias: {
      '@': srcDir,
    },
  },
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          babelrc: true,
          configFile: true,
        },
        type: 'javascript/auto',
        dependency: { not: ['url'] },
      },
      {
        test: cssRegex,
        rules: getStyleLoaders({
          importLoaders: 1,
          sourceMap: true,
        }),
        // Don't consider CSS imports dead code even if the
        // containing package claims to have no side effects.
        // Remove this when webpack adds a warning or an error for this.
        // See https://github.com/webpack/webpack/issues/6571
        sideEffects: true,
        type: 'javascript/auto',
        dependency: { not: ['url'] },
      },
      {
        test: sassRegex,
        rules: getStyleLoaders({
          importLoaders: 1,
          sourceMap: true,
        }, 'fast-sass-loader'),
        sideEffects: true,
        type: 'javascript/auto',
        dependency: { not: ['url'] },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|svgz)(\?.+)?$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 1024,
          },
        },
        generator: {
          filename: path.posix.join(distDir, 'images/[name]-[contenthash:5].[ext]'),
        },
      },
      {
        test: /\.(eot|ttf|woff|woff2)(\?.+)?$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 1024,
          },
        },
        generator: {
          filename: path.posix.join(distDir, 'fonts/[name]-[contenthash:5].[ext]'),
        },
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: true,
  },
  // externals: [{
  //   react: {
  //     root: 'React',
  //     amd: 'react',
  //     commonjs2: 'react',
  //     commonjs: 'react',
  //   },
  //   'react-dom': {
  //     root: 'ReactDOM',
  //     amd: 'react-dom',
  //     commonjs2: 'react-dom',
  //     commonjs: 'react-dom',
  //   },
  // }],
  devServer: devServerOpt,
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.PUBLIC_URL': JSON.stringify(publicPath.slice(0, -1)),
      'process.env.VERSION': JSON.stringify(pkg.version),
      'process.env.PUBLIC_TIME': JSON.stringify(getCurrentTime()),
    }),
    new ESLintPlugin({
      emitWarning: isWatch,
      extensions: ['js', 'jsx', 'ts', 'tsx'],
      context: srcDir,
      threads: true,
    }),
    new StylelintPlugin({
      emitWarning: isWatch,
      extensions: ['css', 'scss', 'sass', 'less'],
      context: srcDir,
      threads: true,
    }),
    new HtmlWebpackPlugin({
      template: path.join(publicDir, 'index.html'),
    }),
    new MiniCssExtractPlugin({
      filename: 'styles/[name]-[contenthash:5].css',
      chunkFilename: 'styles/[name]-[contenthash:5].chunk.css'
    })
  ].filter(Boolean),
};

module.exports = config;
