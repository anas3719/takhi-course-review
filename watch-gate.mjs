// A local prototype: playback evidence is not identity or attention evidence.
export class WatchGate {
  constructor(requiredEnd, ranges = []) {
    this.end = requiredEnd;
    this.ranges = [];
    for (const range of ranges) if (Array.isArray(range)) this.add(...range);
  }
  add(start, end) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return;
    const next = [...this.ranges, [Math.min(start, this.end), Math.min(end, this.end)]]
      .filter(([a,b]) => b > a).sort((a,b) => a[0] - b[0]);
    this.ranges = [];
    for (const [a,b] of next) {
      const last = this.ranges.at(-1);
      if (last && a <= last[1] + 0.04) last[1] = Math.max(last[1], b);
      else this.ranges.push([a,b]);
    }
  }
  get frontier() { return this.ranges[0]?.[0] <= 0.04 ? this.ranges[0][1] : 0; }
  get complete() { return this.frontier >= this.end - 0.04; }
  get ratio() { return Math.min(1, this.frontier / this.end); }
}
