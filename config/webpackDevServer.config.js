'use strict';

const fs = require('fs');
const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
const paths = require('./paths');

const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const host = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

module.exports = function (proxy, allowedHost) {
  return {
    // Enable gzip compression of generated files.
    compress: true,

    // Enable hot reloading server. It will provide /sockjs-node/ endpoint
    // for the WebpackDevServer client so it can learn when the files were
    // updated. The WebpackDevServer client is included as an entry point
    // in the Webpack development configuration. Note that only changes
    // to CSS are currently hot reloaded. JS changes will refresh the browser.
    hot: true,
    client: {
      // Silence WebpackDevServer's own logs since they're generally not useful.
      // It will still show compile warnings and errors with this setting.
      logging: 'error',
      webSocketURL: {
        hostname: 'localhost',
        port: 443,
        pathname: '/ws',
        protocol: 'wss',
      },
    },
    static: {
      // By default WebpackDevServer serves physical files from current directory
      // in addition to all the virtual build products that it serves from memory.
      // This is confusing because those files won’t automatically be available in
      // production build folder unless we copy them. However, copying the whole
      // project directory is dangerous because we may expose sensitive files.
      // Instead, we establish a convention that only files in `public` directory
      // get served. Our build script will copy `public` into the `build` folder.
      // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
      // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
      // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
      // Note that we only recommend to use `public` folder as an escape hatch
      // for files like `favicon.ico`, `manifest.json`, and libraries that are
      // for some reason broken when imported through Webpack. If you just want to
      // use an image, put it in `src` and `import` it from JavaScript instead.
      directory: paths.appPublic,
      // It is important to tell WebpackDevServer to use the same "root" path
      // as we specified in the config. In development, we always serve from /.
      publicPath: '/',
    },
    watchFiles: [
      './index.js',
      paths.appSrc,
    ],
    // Enable HTTPS if the HTTPS environment variable is set to 'true'
    https: protocol === 'https',
    host,
    port,
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // See https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true,
    },
    allowedHosts: [
      allowedHost,
    ],
    proxy,
    onBeforeSetupMiddleware(server) {
      if (!server) {
        throw new Error('webpack-dev-server is not defined');
      }

      const { app } = server;

      if (fs.existsSync(paths.proxySetup)) {
        // This registers user provided middleware for proxy reasons
        require(paths.proxySetup)(app);
      }

      // This lets us fetch source contents from webpack for the error overlay
      app.use(evalSourceMapMiddleware(server));
      // This lets us open files from the runtime error overlay.
      app.use(errorOverlayMiddleware());

      // This service worker file is effectively a 'no-op' that will reset any
      // previous service worker registered for the same host:port combination.
      // We do this in development to avoid hitting the production cache if
      // it used the same host and port.
      // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
      app.use(noopServiceWorkerMiddleware(''));
    },
  };
};
