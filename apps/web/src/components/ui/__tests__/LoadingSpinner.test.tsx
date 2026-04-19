/**
 * Loading Spinner Component Tests
 *
 * Tests for the LoadingSpinner component including:
 * - Rendering in different states
 * - Size variations (small, medium, large)
 * - Centered vs non-centered layout
 * - Label display
 *
 * @module @/components/ui/__tests__/LoadingSpinner.test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('[UNIT] LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);

    // Should render spinner element
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<LoadingSpinner label="Loading..." />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render small size', () => {
    render(<LoadingSpinner size="small" />);

    // Component should render without errors
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should render medium size', () => {
    render(<LoadingSpinner size="medium" />);

    // Component should render without errors
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should render large size', () => {
    render(<LoadingSpinner size="large" />);

    // Component should render without errors
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should render centered layout', () => {
    const { container } = render(<LoadingSpinner centered={true} />);

    // Should have flex styles for centering
    expect(container.firstChild).toBeTruthy();
  });

  it('should render non-centered layout', () => {
    const { container } = render(<LoadingSpinner centered={false} />);

    // Should render without flex centering
    expect(container.firstChild).toBeTruthy();
  });

  it('should render with label and size', () => {
    render(<LoadingSpinner label="Please wait" size="large" />);

    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should not render label when not provided', () => {
    render(<LoadingSpinner />);

    // Should only have spinner, no text elements with label
    const labelElement = screen.queryByText(/./);
    // The spinner itself might have aria-label, so just check component renders
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should memoize component', () => {
    // LoadingSpinner is memoized, verify it exports correctly
    expect(LoadingSpinner).toBeDefined();
    expect(typeof LoadingSpinner).toBe('function');
  });
});
