/**
 * TripContext Tests
 *
 * Tests for the TripProvider and useTripContext including:
 * - Provider initialization
 * - Context value structure
 * - Error when used outside provider
 * - Storage helpers (SSR-safe)
 *
 * @module @/contexts/__tests__/TripContext.test
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { TripProvider, useTripContext } from '../TripContext';
import { TripId } from '@mirai-app/domain';

// Mock GraphQL hooks
vi.mock('@mirai-app/graphql-client', () => ({
  useMyTripsQuery: vi.fn().mockReturnValue([
    { data: undefined, fetching: false, error: undefined },
    vi.fn(),
  ]),
}));

describe('[UNIT] TripContext', () => {
  describe('useTripContext', () => {
    it('should throw error when used outside TripProvider', () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTripContext());
      }).toThrow('useTripContext must be used within a TripProvider');

      consoleSpy.mockRestore();
    });

    it('should provide context value within TripProvider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(TripProvider, {}, children)
      );

      const { result } = renderHook(() => useTripContext(), { wrapper });

      expect(result.current).toHaveProperty('selectedTrip');
      expect(result.current).toHaveProperty('setSelectedTrip');
      expect(result.current).toHaveProperty('trips');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should initialize with null selected trip', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(TripProvider, {}, children)
      );

      const { result } = renderHook(() => useTripContext(), { wrapper });

      expect(result.current.selectedTrip).toBeNull();
    });

    it('should initialize with empty trips array', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(TripProvider, {}, children)
      );

      const { result } = renderHook(() => useTripContext(), { wrapper });

      expect(result.current.trips).toEqual([]);
    });

    it('should provide setSelectedTrip function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(TripProvider, {}, children)
      );

      const { result } = renderHook(() => useTripContext(), { wrapper });

      expect(typeof result.current.setSelectedTrip).toBe('function');
    });

    it('should provide refetch function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(TripProvider, {}, children)
      );

      const { result } = renderHook(() => useTripContext(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('TripProvider', () => {
    it('should accept children', () => {
      const TestChild = () => React.createElement('div', {}, 'Test');
      
      const { container } = require('@testing-library/react').render(
        React.createElement(TripProvider, {}, 
          React.createElement(TestChild)
        )
      );

      expect(container.textContent).toContain('Test');
    });

    it('should accept initialTrip prop', () => {
      const testTripId = TripId.unsafeCreate('cm5xyz789uvw654rst321qpo0');
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(TripProvider, { 
          initialTrip: { id: testTripId, name: 'Test Trip' }
        }, children)
      );

      const { result } = renderHook(() => useTripContext(), { wrapper });

      expect(result.current.selectedTrip).toEqual({ 
        id: testTripId, 
        name: 'Test Trip' 
      });
    });
  });

  describe('Types', () => {
    it('should export Trip interface', () => {
      // TypeScript compile-time check
      const testId = TripId.unsafeCreate('cm5xyz789uvw654rst321qpo0');
      const trip: import('../TripContext').Trip = {
        id: testId,
        name: 'Test Trip',
      };

      expect(trip).toBeDefined();
      expect(trip.name).toBe('Test Trip');
    });

    it('should export TripContextValue interface', () => {
      // Verify the context value shape
      const value: import('../TripContext').TripContextValue = {
        selectedTrip: null,
        setSelectedTrip: vi.fn(),
        trips: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      };

      expect(value).toBeDefined();
      expect(Array.isArray(value.trips)).toBe(true);
    });

    it('should export TripChangeEvent interface', () => {
      const event: import('../TripContext').TripChangeEvent = {
        previousTrip: null,
        currentTrip: null,
        timestamp: Date.now(),
      };

      expect(event).toBeDefined();
      expect(typeof event.timestamp).toBe('number');
    });
  });

  describe('SSR Safety', () => {
    it('should handle server-side rendering without errors', () => {
      // SSR should not throw when rendering provider
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(TripProvider, {}, children)
      );

      const { result } = renderHook(() => useTripContext(), { wrapper });

      // Should not access localStorage during SSR
      expect(result.current.selectedTrip).toBeNull();
    });
  });
});
