/* allows at most `limit` hits per key in any `windowMs` window */
export class RateLimiter {
  private hits = new Map<string, number[]>()

  constructor(
    private limit: number,
    private windowMs: number,
    private now: () => number = Date.now,
  ) {}

  allow(key: string): boolean {
    const cutoff = this.now() - this.windowMs
    const recent = (this.hits.get(key) ?? []).filter((time) => time > cutoff)
    const allowed = recent.length < this.limit
    if (allowed) recent.push(this.now())
    this.hits.set(key, recent)
    return allowed
  }

  forget(key: string) {
    this.hits.delete(key)
  }
}