// Re-export DatabaseError and error interfaces from errors module for ports
export { DatabaseError } from "../system/errors";
export type { DatabaseGatewayError, GatewayError } from "./gateway-error";
