type TypeVersionResolver = () => Promise<string>;
export type TypeVersion = string | TypeVersionResolver;
export type TypeCacheItem = {
  url: string;
  version?: TypeVersion;
  proxy?: TypeVersion;
};
