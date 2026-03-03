import { GeoWord, GEOGRAPHY_CATEGORIES } from "./types";
import { WORDS_5 } from "./words_5";
import { WORDS_6 } from "./words_6";
import { WORDS_7 } from "./words_7";

export { GEOGRAPHY_CATEGORIES };
export type { GeoWord };

export const GEOGRAPHY_WORDS: GeoWord[] = [
  ...WORDS_5,
  ...WORDS_6,
  ...WORDS_7
];
