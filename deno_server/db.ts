/// <reference lib="deno.unstable" />

const kv = await Deno.openKv();

export async function get<T>(key: string[]): Promise<T | null> {
  const result = await kv.get<T>(key);
  return result.value;
}

export async function set(key: string[], value: any) {
  await kv.set(key, value);
}

export async function list<T>(prefix: string[]): Promise<T[]> {
  const iter = kv.list<T>({ prefix });
  const items: T[] = [];
  for await (const res of iter) {
    items.push(res.value);
  }
  return items;
}

export async function deleteKey(key: string[]) {
  await kv.delete(key);
}

// Helper to keep array-like structure for existing frontend compatibility
// We will store huge arrays in a single key for simplicity to match existing file structure,
// although Deno KV is better suited for individual keys.
// Given the scale mentioned in conversation (JSON files), it's likely small enough to fit in a value (Limit 64KB).
// WAIT. Deno KV value limit is 64KB. competitors.json is 500KB+. 
// Strategy Change: store items individually under a prefix.

export const DB = {
  // Competitors
  async getCompetitors() {
    // List all under ["competitors"]
    const iter = kv.list({ prefix: ["competitors"] });
    const items = [];
    for await (const res of iter) {
      items.push(res.value);
    }
    return items;
  },
  async saveCompetitors(data: any[]) {
    // This is a "Replace All" operation in the original file logic.
    // In KV, we should ideally delete old ones or update.
    // For simplicity and to match the "save entire list" behavior:
    // 1. Delete all existing
    const iter = kv.list({ prefix: ["competitors"] });
    const promises = [];
    for await (const res of iter) {
      promises.push(kv.delete(res.key));
    }
    await Promise.all(promises);
    
    // 2. Add new ones
    const writePromises = data.map(item => {
      // Use item.id as key if available, else generate one? 
      // The frontend sends the full list with IDs usually.
      const key = ["competitors", item.id || crypto.randomUUID()];
      return kv.set(key, item);
    });
    await Promise.all(writePromises);
  },

  // Favorites
  async getFavorites() {
    const iter = kv.list({ prefix: ["favorites"] });
    const items = [];
    for await (const res of iter) {
      items.push(res.value);
    }
    return items;
  },
  async saveFavorites(data: any[]) {
    // Replace all logic
    const iter = kv.list({ prefix: ["favorites"] });
    const delPromises = [];
    for await (const res of iter) {
      delPromises.push(kv.delete(res.key));
    }
    await Promise.all(delPromises);

    const writePromises = data.map(item => {
      // construct a unique key. favorites usually have productId
      const key = ["favorites", item.productId || crypto.randomUUID()];
      return kv.set(key, item);
    });
    await Promise.all(writePromises);
  },

  // Deep Reports
  async getDeepReports() {
     const iter = kv.list({ prefix: ["deep_reports"] });
     const items = [];
     for await (const res of iter) {
       items.push(res.value);
     }
     return items;
  },
  async saveDeepReport(report: any) {
    // Upsert single report
    // Key by productId usually
    const key = ["deep_reports", report.productId];
    // Check if exists to update timestamps if you want, but simple override is fine
    // The python logic did some timestamp updates.
    
    const existing = await kv.get(key);
    const now = new Date().toISOString();
    
    if (existing.value) {
        // @ts-ignore
        report.updatedAt = now;
        // @ts-ignore
        report.createdAt = existing.value.createdAt || now;
    } else {
        report.createdAt = now;
        report.updatedAt = now;
    }
    
    await kv.set(key, report);
  },
  async deleteDeepReport(productId: string) {
      await kv.delete(["deep_reports", productId]);
  },
  async clearDeepReports() {
       const iter = kv.list({ prefix: ["deep_reports"] });
    for await (const res of iter) {
      await kv.delete(res.key);
    }
  },

  // History - Assuming it's a list that grows. 
  // In Python it was a list of max 100 items.
  async getHistory() {
     const iter = kv.list<any>({ prefix: ["history"] });
     const items = [];
     for await (const res of iter) {
       items.push(res.value);
     }
     // Sort by timestamp desc (newest first)
     return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async saveHistory(record: any) {
      // Insert one record
      const key = ["history", record.id];
      await kv.set(key, record);
      
      // Cleanup old records if > 100
      // This might be expensive in KV to do strictly every time, but let's try.
      const all = await this.getHistory(); // already sorted
      if (all.length > 100) {
          const toDelete = all.slice(100);
          for (const item of toDelete) {
              await kv.delete(["history", item.id]);
          }
      }
  },
  async deleteHistory(id: string) {
      await kv.delete(["history", id]);
  },
  async clearHistory() {
    const iter = kv.list({ prefix: ["history"] });
    for await (const res of iter) {
      await kv.delete(res.key);
    }
  }
};
