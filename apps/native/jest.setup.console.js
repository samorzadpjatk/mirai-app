// Suppress specific console noise during tests without breaking spies
const suppressPatterns = [
  /react-test-renderer is deprecated/,
  /act\(\) is not supported/,
];

const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

console.warn = (...args) => {
  const message = String(args[0]);
  if (suppressPatterns.some((pattern) => pattern.test(message))) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args) => {
  const message = String(args[0]);
  if (suppressPatterns.some((pattern) => pattern.test(message))) {
    return;
  }
  originalError(...args);
};

// Verify setup ran
console.log("[jest.setup.console] Console override applied");
