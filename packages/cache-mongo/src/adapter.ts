// cache/adapters/MongoCacheAdapter.ts
import mongoose, { Schema, model, type Model } from "mongoose";
import { BaseCacheAdapter } from "@honocord/cache-base";

interface CacheDoc {
  _id: string;
  value: unknown;
  expireAt: Date | null;
}

const cacheSchema = new Schema<CacheDoc>({
  _id: { type: String },
  value: { type: Schema.Types.Mixed, required: true },
  expireAt: {
    type: Date,
    default: () => null,
    index: { expireAfterSeconds: 0 },
  },
});

export class MongoCacheAdapter extends BaseCacheAdapter {
  private readonly uri: string;
  private ready: Promise<void>;
  private CacheModel!: Model<CacheDoc>;

  constructor(uri: string) {
    super();
    this.uri = uri;
    // Auto-connect on construction; errors surface on first use
    this.ready = this._init();
  }

  private async _init(): Promise<void> {
    await mongoose.connect(this.uri);
    // Use existing model if already registered (hot reload / re-instantiation safety)
    this.CacheModel = mongoose.models["HonocordCache"] ?? model<CacheDoc>("HonocordCache", cacheSchema);
  }

  // Explicit connect for startup-time error surfacing
  override async connect(): Promise<this> {
    await this.ready;
    return this;
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ready;
    const doc = await this.CacheModel.findOne({
      _id: key,
      $or: [{ expireAt: null }, { expireAt: { $gt: new Date() } }],
    }).lean();
    return (doc?.value as T) ?? null;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.ready;
    await this.CacheModel.updateOne(
      { _id: key },
      { value, expireAt: ttlMs !== undefined ? new Date(Date.now() + ttlMs) : null },
      { upsert: true }
    );
  }

  async delete(key: string): Promise<void> {
    await this.ready;
    await this.CacheModel.deleteOne({ _id: key });
  }

  async has(key: string): Promise<boolean> {
    await this.ready;
    const exists = await this.CacheModel.exists({
      _id: key,
      $or: [{ expireAt: null }, { expireAt: { $gt: new Date() } }],
    });
    return !!exists;
  }

  async clear(): Promise<void> {
    await this.ready;
    await this.CacheModel.deleteMany({});
  }
}
