// Ember & Thyme — Hearth Kitchen: a tiny seeded random generator.
// One clear job: repeatable randomness, so a screenshot staged with a seed
// always shows the same orders, and the game stays fair without Math.random
// sprinkled through the logic.

export function makeRandom(seed) {
  let s = (seed >>> 0) || 1;
  return {
    next() {
      // Mulberry32: small, fast, and good enough for a kitchen.
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
  };
}
