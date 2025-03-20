/**
 * @see https://babeljs.io/docs/en/babel-preset-env#options
 * @see https://blog.windstone.cc/es6/babel/@babel/plugin-transform-runtime.html
 * @see https://github.com/babel/babel-preset-env/issues/76
 * 注意 package.json 中的 browserslist 属性，对编译结果是有影响的，不能移除。
 */

const presets = [];
const presetEnv = ['@babel/preset-env'];

const presetEnvOptions = {};
if (process.env.TEST_ENV === 'jest') {
  presetEnvOptions.targets = {
    node: 'current',
  };
} else {
  // 缺少 loose 选项，会导致 es5 编译失败
  presetEnvOptions.loose = true;
  // modules 选项设置为 false, 是为了 tree-shaking 生效
  presetEnvOptions.modules = false;
}
presetEnv.push(presetEnvOptions);

presets.push(presetEnv);


const plugins = [];

const runtime = ['@babel/plugin-transform-runtime', {
  regenerator: true,
}];
plugins.push(runtime);

const babelConfig = {
  presets,
  plugins,
};

module.exports = babelConfig;
