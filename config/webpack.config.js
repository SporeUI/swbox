const $fse = require('fs-extra');
const $path = require('path');
const $webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const paths = require('./paths');
const $config = require('../sconfig');
const $package = require('../package.json');

module.exports = function (mode) {
  const isProd = mode === 'production';
  const isDev = mode === 'development';
  const isOther = !isProd && !isDev;
  const useEs6 = process.env.COMPILE_TARGET === 'es6';

  console.info('process.env.COMPILE_TARGET:', process.env.COMPILE_TARGET);

  const tsUse = [];
  const tsLoader = {
    loader: require.resolve('ts-loader'),
    options: {
      allowTsInNodeModules: false,
    },
  };

  const resolvePlugins = [];

  const wpModuleRules = [{
    test: /\.tsx?$/,
    use: tsUse,
  }];
  tsUse.push(tsLoader);

  const webpackConfig = {
    mode: isProd ? 'production' : 'development',
    // entry: [
    //   isDev && require.resolve('react-dev-utils/webpackHotDevClient'),
    //   paths.appIndexJs,
    // ].filter(Boolean),
    entry: {
      sw: paths.appSWJs,
      'spore-swbox': [isDev && require.resolve('react-dev-utils/webpackHotDevClient'), paths.appIndexJs].filter(
        Boolean,
      ),
    },
    output: {
      path: isProd || isOther ? paths.appBuild : undefined,
      pathinfo: isDev,
      // filename: $config.name + (isProd ? '.min.js' : '.js'),
      library: $config.name,
      libraryTarget: 'umd',
    },
    resolve: {
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: ['.ts', '.tsx', '.js'],
      plugins: resolvePlugins,
    },
    devtool: isProd || isOther ? undefined : 'eval-cheap-module-source-map',
    module: {
      rules: wpModuleRules,
    },
    plugins: [
      new $webpack.DefinePlugin({
        'process.env': {
          VERSION: JSON.stringify($package.version),
        },
      }),
    ],
  };

  if (useEs6) {
    webpackConfig.optimization = {
      usedExports: true,
      minimizer: [new TerserPlugin()],
    };
    webpackConfig.target = 'web';
  }

  if (isProd || isDev) {
    const files = $fse.readdirSync(paths.appTplDir);
    if (files.length <= 1) {
      const htmlPligin = new HtmlWebpackPlugin({
        title: $package.name,
        inject: false,
        minify: false,
        filename: 'index.html',
        template: paths.appHtml,
      });
      webpackConfig.plugins.push(htmlPligin);
    } else {
      files.forEach((file) => {
        const tplPath = $path.join(paths.appTplDir, file);
        const pureName = $path.basename(file, $path.extname(file));
        const htmlPligin = new HtmlWebpackPlugin({
          title: $package.name,
          inject: false,
          minify: false,
          filename: `${pureName}.html`,
          template: tplPath,
        });
        webpackConfig.plugins.push(htmlPligin);
      });
    }
  }
  return webpackConfig;
};
