/// <reference lib="webworker" />

import { TypeCacheItem } from '../types';
const that = self;

export default class DBHelper {
  private static dbInstance: DBHelper;
  static getdbInstance() {
    if (!DBHelper.dbInstance) {
      DBHelper.dbInstance = new DBHelper();
    }
    return DBHelper.dbInstance;
  }
  private dbName = 'swbox-cache';
  private storeName = 'cacheData';
  private db: IDBDatabase | null = null;
  private constructor() {};

  openDB(): Promise<void> {
    return new Promise((resolve) => {
      this.getDBOpenRequest().onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  getCacheItems(): Promise<TypeCacheItem[]> {
    const cacheItems: TypeCacheItem[] = [];
    return new Promise((resolve) => {
      this.getDBRequest().onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest).result;
        if (!cursor) {
          resolve(cacheItems);
        } else {
          cacheItems.push(cursor.value);
          cursor.continue();
        }
      };
    });
  }

  async getCaches() {
    const checkDatabase = await this.isHasDatabase();
    if (!checkDatabase) return [];
    await this.openDB();
    return this.nonNullDB() ? await this.getCacheItems() : [];
  }

  private async isHasDatabase(): Promise<boolean> {
    const databases = await that.indexedDB.databases();
    const index = databases.findIndex(item => {
      return item.name === 'swbox-cache';
    });
    return index !== -1;
  }

  private getDBOpenRequest() {
    return that.indexedDB.open(this.dbName);
  }

  private nonNullDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('DB is not opened');
    }
    return this.db.objectStoreNames.contains(this.storeName) ? this.db : null;
  }

  private getDBRequest() {
    const transaction = this.nonNullDB().transaction(this.storeName, 'readwrite');
    const objectStore = transaction.objectStore(this.storeName);
    return objectStore.openCursor();
  }
}
