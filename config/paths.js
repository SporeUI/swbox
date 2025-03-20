const $path = require('path');

const resolveApp = function (relativePath) {
  const cwd = process.cwd();
  return $path.join(cwd, relativePath);
};

module.exports = {
  appPath: resolveApp('.'),
  appBuild: resolveApp('dist'),
  appPublic: resolveApp('public'),
  appTplDir: resolveApp('public/'),
  appHtml: resolveApp('public/index.ejs'),
  appIndexJs: resolveApp('src/index.ts'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  appEs6TsConfig: resolveApp('tsconfig.es6.json'),
  appTsConfig: resolveApp('tsconfig.json'),
  proxySetup: resolveApp('src/setupProxy.js'),
  appNodeModules: resolveApp('node_modules'),
  appSWJs: resolveApp('src/sw.ts'),
};
