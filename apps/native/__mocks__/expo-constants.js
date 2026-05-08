const mockConstants = {
  manifest: { version: "1.0.0", name: "MIRAI" },
  expoConfig: { version: "1.0.0", name: "MIRAI" },
  getWebViewUserAgentAsync: jest.fn(() => Promise.resolve("mock-user-agent")),
};

export default mockConstants;
export const manifest = mockConstants.manifest;
export const expoConfig = mockConstants.expoConfig;
export const getWebViewUserAgentAsync = mockConstants.getWebViewUserAgentAsync;
