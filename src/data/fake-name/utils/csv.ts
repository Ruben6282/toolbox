// Escape CSV values
export const escapeCsv = (val: string) =>
  `"${val.replace(/"/g, '""')}"`;
