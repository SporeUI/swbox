import { TypeCacheItem } from './comp/types';

type TypeSWConfig = {
  indexedDBName?: string;
  registerUrl: string;
};

let swConfig: TypeSWConfig = {
  indexedDBName: 'swbox-cache',
  registerUrl: '',
};

const ruleList: TypeCacheItem[] = [];
const sw = window.navigator.serviceWorker;

const windowOnLoad = () => new Promise(resolve => window.addEventListener('load', resolve));

const setSWCacheFromLocalStorage = () => {
  localStorage.setItem('swboxcache', JSON.stringify(ruleList));
};

const initCacheItems = (sw: ServiceWorker, data: Object): void => {
  // sw启用后，传递新的版本号信息
  // 拿到版本号信息后，决定使用缓存还是使用新的地址
  sw?.postMessage(data);
  // 删除缓存过的过期文件
  checkPostmessageDel();
  navigator.serviceWorker.addEventListener('message', (event) => {
    // 在页面上打印缓存数据
    console.info('index', event.data);
  });
};

const getSW = async (): Promise<ServiceWorker> => {
  if (isSWAlreadyRegistered()) {
    return sw.controller;
  }
  await windowOnLoad();
  const scopePath = window.location.pathname;
  const registration = await navigator.serviceWorker.register(swConfig.registerUrl, { scope: scopePath });
  return registration.installing || registration.active;
};

const isSWAlreadyRegistered = (): boolean => !!sw.controller;

const delCaches = async () => {
  if (window.caches?.keys) {
    const keys = await caches.keys();
    const pms = keys.map(key => caches.delete(key));
    await Promise.all(pms);
  }
};

const checkPostmessageDel = async () => {
  if (!window.caches?.keys) {
    return;
  }
  const keys = await caches.keys();
  const pms = keys.map(async (key) => {
    const cacheReq = await caches.open(key);
    const cacheReqList = await cacheReq.keys();
    cacheReqList.forEach((item) => {
      const index = ruleList.findIndex((ruleItem => item.url.indexOf(`${ruleItem.url}${ruleItem.version ? `?v=${ruleItem.version}` : ''}`) !== -1));
      if (index === -1) {
        cacheReq.delete(item);
      }
    });
  });
  await Promise.all(pms);
};


const SWBox = {
  support() {
    return !!sw;
  },
  setConfig(config: TypeSWConfig) {
    if (!this.support()) return;
    swConfig = { ...swConfig, ...config };
  },
  async add(cacheItem: TypeCacheItem) {
    if (!this.support()) return;
    const params: TypeCacheItem = {
      url: cacheItem.url,
    };
    if (cacheItem.version) {
      // 支持传入字符串或者构造函数
      // 用于校验文件版本信息
      const version = typeof cacheItem.version === 'string' ? cacheItem.version : await cacheItem.version();
      params.version = version;
    }
    if (cacheItem.proxy) {
      // 支持传入字符串或者构造函数
      // proxy用于完整替换请求地址
      const proxy = typeof cacheItem.proxy === 'string' ? cacheItem.proxy : await cacheItem.proxy();
      params.proxy = proxy;
    }
    ruleList.push(params);
  },
  async start() {
    if (!this.support()) return;
    // 排查存储资源列表
    setSWCacheFromLocalStorage();
    // 发送缓存信息到sw进程
    initCacheItems(await getSW(), { ruleList });
    // 通知sw，页面已经load
    window.addEventListener('load', () => {
      sw?.controller?.postMessage({ pageLoad: true });
    });
  },
  async clear() {
    if (!this.support()) return;
    if (isSWAlreadyRegistered()) {
      // 为了让当前页面请求立即走到最新列表，发送最近列表信息
      initCacheItems(await getSW(), { unregister: true });
    }
    // 防止多个sw被注册情况
    const res = await sw.getRegistrations();
    const pms = res.map(cursw => cursw.unregister());
    await Promise.all(pms);
    delCaches();
  },
  clearCache() {
    if (!this.support()) return;
    delCaches();
  },
};

const version = process.env.VERSION;
console.log('sw proxy version', version);
export default SWBox;
