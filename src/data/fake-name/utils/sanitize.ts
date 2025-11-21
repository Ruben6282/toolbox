// Lowercase + allow only [a-z0-9.-]
export const sanitizeEmailUser = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9.-]/g, "");
