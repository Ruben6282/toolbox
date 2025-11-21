// Cryptographically strong random number in [0,1)
export const rand = (): number => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 0xffffffff;
};
