// Test script to check schema contents
import { schema } from "./schema";
import { printSchema } from "graphql";

const sdl = printSchema(schema);
console.log("=== Types in schema ===");
const types = sdl.match(/type\s+\w+/g);
if (types) {
  types.slice(0, 50).forEach((t) => console.log(t));
}

console.log("\n=== User type present? ===");
console.log(sdl.includes("type User"));

console.log("\n=== Query fields ===");
const queryMatch = sdl.match(/type Query\s*\{([^}]+)\}/s);
if (queryMatch) {
  console.log(queryMatch[0].slice(0, 2000));
} else {
  console.log("Query type not found with simple regex");
  // Try to find user field
  const lines = sdl.split("\n");
  const queryStart = lines.findIndex((l) => l.includes("type Query"));
  if (queryStart >= 0) {
    console.log("Query type starts at line", queryStart);
    console.log(lines.slice(queryStart, queryStart + 30).join("\n"));
  }
}

console.log("\n=== Checking for user(id: ID!): User ===");
console.log(sdl.includes("user(id: ID!): User"));
console.log(sdl.includes("user(id"));
