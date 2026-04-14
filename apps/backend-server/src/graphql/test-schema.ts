// Test script to check schema contents
import { schema } from "./schema";
import { printSchema } from "graphql";
import { serverLogger } from "@mirai-app/shared";

const sdl = printSchema(schema);
serverLogger.debug("=== Types in schema ===");
const types = sdl.match(/type\s+\w+/g);
if (types) {
  serverLogger.debug(`Types found: ${types.slice(0, 50).join(", ")}`);
}

serverLogger.debug("=== User type present? ===");
serverLogger.debug(`User type present: ${sdl.includes("type User")}`);

serverLogger.debug("=== Query fields ===");
const queryMatch = sdl.match(/type Query\s*\{([^}]+)\}/s);
if (queryMatch) {
  serverLogger.debug(`Query fields: ${queryMatch[0].slice(0, 2000)}`);
} else {
  serverLogger.debug("Query type not found with simple regex");
  // Try to find user field
  const lines = sdl.split("\n");
  const queryStart = lines.findIndex((l) => l.includes("type Query"));
  if (queryStart >= 0) {
    serverLogger.debug(`Query type starts at line ${queryStart}`);
    serverLogger.debug(
      `Query type content: ${lines.slice(queryStart, queryStart + 30).join("\n")}`,
    );
  }
}

serverLogger.debug("=== Checking for user(id: ID!): User ===");
serverLogger.debug(
  `user(id: ID!): User present: ${sdl.includes("user(id: ID!): User")}`,
);
serverLogger.debug(`user(id present: ${sdl.includes("user(id")}`);
