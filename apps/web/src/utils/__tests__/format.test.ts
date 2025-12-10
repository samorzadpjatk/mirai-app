import { describe, it, expect } from "vitest";
import { formatDate, formatAmount, formatDateTime, getBaseUrl } from '~/utils/format';

describe('formatDate', () => {
    it('should return empty string for null', () => {
        expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
        expect(formatDate(undefined)).toBe('');
    });

    it('should format date correctly in Polish locale', () => {
        const date = new Date('2025-10-31T14:30:00');
        const formatted = formatDate(date);
        expect(formatted).toMatch(/31\.10\.2025.*14:30/);
    });

    it('should handle Date object correctly', () => {
        const date = new Date('2023-01-15T09:45:00');
        const formatted = formatDate(date);
        expect(formatted).toMatch(/15\.01\.2023.*09:45/);
    });
});

describe('formatAmount', () => {
    it('should format positive amount with plus sign', () => {
        const result = formatAmount(100);
        expect(result.value).toBe('+100');
        expect(result.color).toBe('green');
        expect(result.icon).toBe('💰');
    });

    it('should format negative amount without plus sign', () => {
        const result = formatAmount(-50);
        expect(result.value).toBe('-50');
        expect(result.color).toBe('red');
        expect(result.icon).toBe('💸');
    });

    it('should handle zero as negative', () => {
        const result = formatAmount(0);
        expect(result.value).toBe('0');
        expect(result.color).toBe('red');
        expect(result.icon).toBe('💸');
    });

    it('should format large positive amounts', () => {
        const result = formatAmount(999999);
        expect(result.value).toBe('+999999');
        expect(result.color).toBe('green');
        expect(result.icon).toBe('💰');
    });

    it('should format large negative amounts', () => {
        const result = formatAmount(-999999);
        expect(result.value).toBe('-999999');
        expect(result.color).toBe('red');
        expect(result.icon).toBe('💸');
    });
});

describe('formatDateTime', () => {
    it('should return "---" for null', () => {
        expect(formatDateTime(null)).toBe('---');
    });

    it('should return "---" for undefined', () => {
        expect(formatDateTime(undefined)).toBe('---');
    });

    it('should format Date object correctly with seconds', () => {
        const date = new Date('2025-10-31T14:30:45');
        const formatted = formatDateTime(date);
        expect(formatted).toMatch(/31\.10\.2025.*14:30:45/);
    });

    it('should format date string correctly', () => {
        const dateString = '2023-06-15T18:20:30';
        const formatted = formatDateTime(dateString);
        expect(formatted).toMatch(/15\.06\.2023.*18:20:30/);
    });

    it('should handle ISO date strings', () => {
        const isoString = '2025-12-25T23:59:59.999Z';
        const formatted = formatDateTime(isoString);
        expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}.*\d{2}:\d{2}:\d{2}/);
    });
});

describe('getBaseUrl', () => {
    it('should return a valid URL in test environment', () => {
        const url = getBaseUrl();
        expect(url).toMatch(/^http(s)?:\/\//);
    });

    it('should return localhost URL when not in browser or Vercel', () => {
        const url = getBaseUrl();
        // In test environment, should return localhost
        expect(url).toContain('localhost');
    });
});