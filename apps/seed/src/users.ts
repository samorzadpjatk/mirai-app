import { parse } from "csv-parse/sync";
import type { CsvUser } from "./types";

export const parseUsersCsv = (csv: string): CsvUser[] =>
  parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
