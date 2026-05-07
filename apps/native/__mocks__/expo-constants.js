module.exports = {
  default: {
    manifest: { version: "1.0.0", name: "MIRAI" },
    expoConfig: { version: "1.0.0", name: "MIRAI" },
    getWebViewUserAgentAsync: jest.fn(() => Promise.resolve("mock-user-agent")),
  },
  manifest: { version: "1.0.0", name: "MIRAI" },
  expoConfig: { version: "1.0.0", name: "MIRAI" },
  getWebViewUserAgentAsync: jest.fn(() => Promise.resolve("mock-user-agent")),
};
