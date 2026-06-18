const CACHE_NAME = 'showyo-media-cache-v1';

class MediaCacheService {
  private blobUrlMap = new Map<string, string>();
  private pendingFetches = new Map<string, Promise<string>>();

  async getCachedUrl(originalUrl: string): Promise<string> {
    if (!originalUrl) return '';

    const cached = this.blobUrlMap.get(originalUrl);
    if (cached) return cached;

    const pending = this.pendingFetches.get(originalUrl);
    if (pending) return pending;

    const fetchPromise = this.fetchAndCache(originalUrl);
    this.pendingFetches.set(originalUrl, fetchPromise);

    try {
      const blobUrl = await fetchPromise;
      return blobUrl;
    } finally {
      this.pendingFetches.delete(originalUrl);
    }
  }

  private async fetchAndCache(url: string): Promise<string> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        const blobUrl = URL.createObjectURL(blob);
        this.blobUrlMap.set(url, blobUrl);
        return blobUrl;
      }

      const response = await fetch(url);
      if (!response.ok) {
        return url;
      }

      const responseClone = response.clone();
      await cache.put(url, responseClone);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      this.blobUrlMap.set(url, blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('MediaCache: Failed to cache', url, error);
      return url;
    }
  }

  async preloadItems(urls: string[]): Promise<void> {
    const uncached = urls.filter(url => url && !this.blobUrlMap.has(url));
    if (uncached.length === 0) return;

    await Promise.allSettled(uncached.map(url => this.getCachedUrl(url)));
  }

  evict(url: string): void {
    const blobUrl = this.blobUrlMap.get(url);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      this.blobUrlMap.delete(url);
    }
    caches.open(CACHE_NAME).then(cache => cache.delete(url)).catch(() => {});
  }

  evictAllExcept(urlsToKeep: Set<string>): void {
    for (const [originalUrl, blobUrl] of this.blobUrlMap.entries()) {
      if (!urlsToKeep.has(originalUrl)) {
        URL.revokeObjectURL(blobUrl);
        this.blobUrlMap.delete(originalUrl);
      }
    }
  }

  isReady(url: string): boolean {
    return this.blobUrlMap.has(url);
  }
}

export const mediaCacheService = new MediaCacheService();
