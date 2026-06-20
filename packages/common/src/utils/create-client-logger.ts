export interface ClientLoggerOptions {
  prefix: string;
}

export function createClientLogger(options: ClientLoggerOptions) {
  const { prefix } = options;
  return {
    info: (msg: string, ...args: unknown[]) => console.info(`[${prefix}] ${msg}`, ...args),
    warn: (msg: string, ...args: unknown[]) => console.warn(`[${prefix}] ${msg}`, ...args),
    error: (msg: string, ...args: unknown[]) => console.error(`[${prefix}] ${msg}`, ...args),
  };
}
