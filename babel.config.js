export const presets = [
  '@babel/preset-env',
  ['@babel/preset-react', { runtime: 'automatic' }],
  // Enable TypeScript support for Babel so jest (babel-jest) can handle .ts/.tsx
  '@babel/preset-typescript',
];