import { rand } from "./random";

// Pick a random element from an array
export const pick = <T,>(list: T[]): T =>
  list[Math.floor(rand() * list.length)];
