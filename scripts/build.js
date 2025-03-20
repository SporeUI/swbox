const chalk = require('chalk');

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err;
});

const webpack = require('webpack');
const configFactory = require('../config/webpack.config');

const build = function (strMode) {
  let mode = 'production';
  let extName = '.min.js';

  // switch (strMode) {
  //   case 'es6-plain':
  //     mode = 'other';
  //     extName = '.es6.js';
  //     process.env.COMPILE_TARGET = 'es6';
  //     break;
  //   case 'es6-min':
  //     mode = 'production';
  //     extName = '.es6.min.js';
  //     process.env.COMPILE_TARGET = 'es6';
  //     break;
  //   case 'es5-plain':
  //     mode = 'other';
  //     extName = '.js';
  //     process.env.COMPILE_TARGET = 'es5';
  //     break;
  //   default:
  //     mode = 'production';
  //     extName = '.min.js';
  //     process.env.COMPILE_TARGET = 'es5';
  // }
  switch (strMode) {
    case 'es6-plain':
      mode = 'other';
      extName = '.js';
      process.env.COMPILE_TARGET = 'es6';
      break;
    case 'es6-min':
      mode = 'production';
      extName = '.min.js';
      process.env.COMPILE_TARGET = 'es6';
      break;
  }

  const config = configFactory(mode);
  // const fileName = $config.name + extName;
  const fileName = `[name]${extName}`;
  console.info(chalk.cyan(`build file: ${fileName} ...`));
  config.output.filename = fileName;

  const compiler = webpack(config);

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;
      if (err) {
        reject(err);
      } else {
        messages = stats.toString({
          all: false,
          modules: true,
          maxModules: 0,
          errors: true,
          warnings: true,
          colors: chalk.supportsColor,
        });
        console.error(messages);
        messages = stats.toJson({ all: false, warnings: true, errors: true });
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        throw new Error(messages.errors.join('\n\n'));
      }
      if (
        process.env.CI
        && (typeof process.env.CI !== 'string' || process.env.CI.toLowerCase() !== 'false')
        && messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\nMost CI servers set it automatically.\n',
          ),
        );
        throw new Error(messages.warnings.join('\n\n'));
      }
      resolve();
    });
  });
};

async function startBuild() {
  await build('es6-plain');
  await build('es6-min');
  await build('es5-plain');
  await build('es5-min');
}

startBuild();
