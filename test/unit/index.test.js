import main from '../../src/index';

describe('main', () => {
  test('验证测试代码成功执行', async () => {
    const count = await main();
    expect(count).toBe(6);
  });
});
