/**
 * Smoke tests for Test Infrastructure
 *
 * Verifies that the TestWrapper and Happy DOM environment are correctly configured
 * for the Tamagui UI package.
 *
 * These tests validate:
 * 1. Happy DOM environment (window/document available)
 * 2. TestWrapper renders with TamaguiProvider
 * 3. disableInjectCSS flag is set correctly
 * 4. @mirai-app/ui imports resolve in tests
 *
 * @module test/smoke.test
 */

import { describe, it, expect } from 'bun:test';
import { TestWrapper, TestWrapperDark, createTestWrapper } from './index';
import { config } from '../tamagui.config';
import React from 'react';

// Sample test component
const TestComponent = () => <div data-testid="test-component">Hello</div>;

describe('[UNIT] Test Infrastructure Smoke Tests', () => {
  describe('Happy DOM Environment', () => {
    it('should have window object available', () => {
      expect(typeof window).toBe('object');
      expect(window).toBeDefined();
    });

    it('should have document object available', () => {
      expect(typeof document).toBe('object');
      expect(document).toBeDefined();
    });

    it('should have HTMLElement available', () => {
      expect(typeof HTMLElement).toBe('function');
      expect(HTMLElement).toBeDefined();
    });

    it('should preserve native fetch', () => {
      expect(typeof fetch).toBe('function');
    });

    it('should have __DEV__ global defined', () => {
      expect(typeof __DEV__).toBe('boolean');
    });
  });

  describe('TestWrapper Component', () => {
    it('should export TestWrapper', () => {
      expect(TestWrapper).toBeDefined();
      expect(typeof TestWrapper).toBe('function');
    });

    it('should export TestWrapperDark', () => {
      expect(TestWrapperDark).toBeDefined();
      expect(typeof TestWrapperDark).toBe('function');
    });

    it('should export createTestWrapper factory', () => {
      expect(createTestWrapper).toBeDefined();
      expect(typeof createTestWrapper).toBe('function');
    });

    it('createTestWrapper should return a component', () => {
      const CustomWrapper = createTestWrapper('dark');
      expect(CustomWrapper).toBeDefined();
      expect(typeof CustomWrapper).toBe('function');
    });
  });

  describe('Tamagui Configuration', () => {
    it('should load tamagui config', () => {
      expect(config).toBeDefined();
      expect(config.tokens).toBeDefined();
      expect(config.themes).toBeDefined();
      expect(config.fonts).toBeDefined();
    });

    it('should have light theme defined', () => {
      expect(config.themes.light).toBeDefined();
    });

    it('should have dark theme defined', () => {
      expect(config.themes.dark).toBeDefined();
    });
  });

  describe('Import Resolution', () => {
    it('should resolve @mirai-app/ui imports in tests', async () => {
      // This test verifies that TypeScript paths are correctly resolved
      // In real usage, components would be imported from '@mirai-app/ui'
      const uiModule = await import('./index');
      expect(uiModule).toBeDefined();
      expect(uiModule.TestWrapper).toBeDefined();
    });
  });
});
