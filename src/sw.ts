/// <reference lib="webworker" />
import CheckMessage from './comp/util/checkMessage';
import { TypeCacheItem } from './comp/types';
import { logger, setLog, clearLog } from './comp/util/logger';

const message = new CheckMessage();
const sw: ServiceWorkerGlobalScope & typeof globalThis = self as any;
let versionList: TypeCacheItem[] = [];
let fetchTime = 0;
let unregister = false;
let clientId = '';
let pageIndexLoad = false;
// let waitPageLoadFetch: Promise<any>[] = [];
interface Typeaa {
  targetUrl: string;
  fetchLatest: Function;
}
let waitPageLoadFetch: Typeaa[] = [];

// 检查是否属于缓存文件
const isVersionedResource = (cacheList: TypeCacheItem[], requestUrl: string) => {
  const index = cacheList.findIndex(item => requestUrl.indexOf(item.url) !== -1);
  return index === -1 ? '' : cacheList[index];
};

// 设置需要缓存的资源
sw.addEventListener('install', (event) => {
  setTimeout(() => {
    message.setState('message');
  }, 50);
  const cacheEvent = async () => {
    const cache = await caches.open('v1');
    const cacheUrl: string[] = [];
    await message.ready();
    const ruleList = versionList;
    ruleList.forEach((item: TypeCacheItem) => {
      if (item.version) {
        cacheUrl.push(`${item.url}?v=${item.version}`);
      } else if (item.proxy) {
        cacheUrl.push(`${item.proxy}`);
      }
    });
    return cache.addAll(cacheUrl);
  };
  event.waitUntil(cacheEvent());
});

// 监听信息读取最新版本信息
sw.addEventListener('message', (event: any) => {
  if (event.source.id) {
    clientId = event.source.id;
  }
  if (event.data.ruleList) {
    setLog('getpostmessage', event.data.ruleList);
    versionList = event.data.ruleList;
  }
  if (event.data.unregister) {
    unregister = true;
  }
  if (event.data.pageLoad) {
    setTimeout(() => {
      pageIndexLoad = true;
      waitPageLoadFetch.forEach((item) => {
        item.fetchLatest(item.targetUrl);
      });
    }, 1000);
  }
  message.setState('message');
});
// 拦截请求命中已缓存资源
sw.addEventListener('fetch', (event: any) => {
  // sw没有页面的刷新概念，所以第一次请求页面地址，更新变量
  const { request } = event;

  if (request.headers.get('Accept').indexOf('text/html') !== -1) {
    // 下列逻辑仅在页面初次进入时执行一次
    clearLog();
    // 标记消息为待接收状态
    message.messageReady = false;
    unregister = false;
    pageIndexLoad = false;
    waitPageLoadFetch = [];
    fetchTime = new Date().getTime();
    // 防止一直pending
    setTimeout(() => {
      // 超时直接标记列表传输就绪
      message.setState('message');
    }, 1500);
    // vconsole组件异步加载，为确保信息可调试，延迟日志打印时间
    setTimeout(() => () => {
      void (async () => {
        setLog('sw worker verison', process.env.VERSION);
        const client = await sw.clients.get(clientId);
        client?.postMessage(logger());
      })();
    }, 4000);
    return;
  }
  // 先临时检查下是否在之前的缓存列表里，如果不在，就不做处理了
  // 但是proxy文件还是要判断缓存
  if (!(/swversion=disable/).test(event.request.url)) {
    const isCache = isVersionedResource(versionList, event.request.url);
    if (!isCache) return;
  }

  // 请求并缓存目标url
  const fetchLatest = async (targetUrl: string) => {
    const requset = await fetch(event.request);
    const cache = await caches.open('v1');
    cache.put(targetUrl, requset.clone());
    setLog(`fetchready[${targetUrl}]`, new Date().getTime() - fetchTime);
    return requset.clone();
  };

  // 匹配目标资源是否被缓存过
  const matchRequestCheck = async (targetUrl: string) => {
    const matchCacheUrl = await caches.match(targetUrl);
    if (matchCacheUrl) {
      setLog(`matchready[${targetUrl}]`, new Date().getTime() - fetchTime);
      // 更新缓存资源，在不影响页面正常加载的情况下
      if (pageIndexLoad) {
        setTimeout(() => {
          fetchLatest(targetUrl);
        }, 500);
      } else {
        waitPageLoadFetch.push({
          fetchLatest,
          targetUrl,
        });
      }
      return matchCacheUrl;
    }
    return await fetchLatest(targetUrl);
  };

  // 检查传递的列表，判定是否从缓存加载资源
  const matchRequest = async () => {
    // 文件参数如果存在swversion=disable，则直接使用缓存文件，不检查版本变更
    if ((/swversion=disable/).test(event.request.url)) {
      return await matchRequestCheck(event.request.url);
    };
    // 等待文件列表更新
    await message.ready();
    // 如果标记文件已取消注册，直接请求最新文件
    if (unregister) return fetch(event.request);
    // 检查文件是否在版本检查列表中
    const curRes = isVersionedResource(versionList, event.request.url);
    // 未在版本检查列表中，走正常请求逻辑
    if (!curRes) return fetch(event.request);
    let isUrlEqual = false;
    let targetUrl = curRes.url;
    setLog('getmessageready', new Date().getTime() - fetchTime);
    const ruleList = versionList;
    // 从文件地址找到相应匹配规则
    const index = ruleList.findIndex(item => item.url === curRes.url);
    const ruleItem = ruleList[index];
    // 判断版本号是否一致
    const isSameVersion = (ruleItem.version === curRes.version) && curRes.version;
    // 是否有使用代理地址
    const isProxy = (ruleItem.proxy === curRes.proxy) && curRes.proxy;
    // 是否未传递版本号与代理地址
    const isUndefined = !curRes.version && !curRes.proxy;
    // url是否相同
    isUrlEqual = !!(isSameVersion || isProxy || isUndefined);
    // 最终比对cacheStorage地址
    targetUrl = `${ruleItem.proxy || `${ruleItem.url}?v=${ruleItem.version}`}`;
    if (isUrlEqual) {
      // url匹配成功，直接取缓存文件
      return await matchRequestCheck(targetUrl);
    }
    // 请求最新资源并缓存
    return await fetchLatest(targetUrl);
  };

  // 看看是否是设置的缓存的资源
  event.respondWith(matchRequest());
});
