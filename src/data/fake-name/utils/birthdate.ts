import { rand } from "./random";

export const generateBirthDate = (age: number): string => {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = Math.floor(rand() * 12) + 1;
  const day = Math.floor(rand() * 28) + 1;

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  return `${year}-${mm}-${dd}`;
};
