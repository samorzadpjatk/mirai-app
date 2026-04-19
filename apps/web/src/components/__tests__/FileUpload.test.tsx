/**
 * File Upload Component Tests
 *
 * Tests for the FileUpload component including:
 * - Rendering in different states
 * - File selection via input
 * - Progress display
 * - Pause/resume controls
 * - Error display
 * - Success state
 *
 * @module @/components/__tests__/FileUpload.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload, FileUploadButton } from '../FileUpload';

// Mock the hook
vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: vi.fn(),
}));

import { useFileUpload } from '@/hooks/useFileUpload';

describe('[UNIT] FileUpload', () => {
  const mockUpload = vi.fn();
  const mockPause = vi.fn();
  const mockResume = vi.fn();
  const mockReset = vi.fn();
  const mockOnUpload = vi.fn();
  const mockOnError = vi.fn();
  const mockOnProgress = vi.fn();

  const defaultMockReturn = {
    upload: mockUpload,
    progress: 0,
    status: 'idle' as const,
    error: null,
    pause: mockPause,
    resume: mockResume,
    reset: mockReset,
    selectedFile: null,
    uploadedUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFileUpload).mockReturnValue(defaultMockReturn);
  });

  it('should render with idle state', () => {
    render(<FileUpload onUpload={mockOnUpload} />);

    expect(screen.getByText('Ready to upload')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop or click to select')).toBeInTheDocument();
    expect(screen.getByText('Select File')).toBeInTheDocument();
  });

  it('should render with custom button text', () => {
    render(<FileUpload onUpload={mockOnUpload} buttonText="Upload Image" />);

    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    render(<FileUpload onUpload={mockOnUpload} placeholder="Drop your file here" />);

    expect(screen.getByText('Drop your file here')).toBeInTheDocument();
  });

  it('should show file info when file is selected', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    vi.mocked(useFileUpload).mockReturnValue({
      ...defaultMockReturn,
      selectedFile: mockFile,
      status: 'uploading',
      progress: 50,
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    expect(screen.getByText('test.jpg')).toBeInTheDocument();
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show pause button when uploading', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      ...defaultMockReturn,
      status: 'uploading',
      progress: 50,
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('should show resume button when paused', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      ...defaultMockReturn,
      status: 'paused',
      progress: 50,
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('should show success state when completed', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      ...defaultMockReturn,
      status: 'completed',
      uploadedUrl: 'https://example.com/file.jpg',
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    expect(screen.getByText('Upload complete')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/file.jpg')).toBeInTheDocument();
    expect(screen.getByText('Change File')).toBeInTheDocument();
  });

  it('should show error state with message', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      ...defaultMockReturn,
      status: 'error',
      error: new Error('Upload failed: network error'),
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(screen.getByText('Upload failed: network error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should call upload when file is selected', async () => {
    render(<FileUpload onUpload={mockOnUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(file);
    });
  });

  it('should call pause when pause button is clicked', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      ...defaultMockReturn,
      status: 'uploading',
      progress: 50,
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    fireEvent.click(screen.getByText('Pause'));

    expect(mockPause).toHaveBeenCalled();
  });

  it('should call resume when resume button is clicked', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      ...defaultMockReturn,
      status: 'paused',
      progress: 50,
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    fireEvent.click(screen.getByText('Resume'));

    expect(mockResume).toHaveBeenCalled();
  });

  it('should show max file size info', () => {
    render(<FileUpload onUpload={mockOnUpload} maxSize={10 * 1024 * 1024} />);

    expect(screen.getByText(/Max size:/)).toHaveTextContent('10 MB');
  });

  it('should show accepted file types', () => {
    render(<FileUpload onUpload={mockOnUpload} accept="image/jpeg,image/png" />);

    expect(screen.getByText(/Accepted:/)).toHaveTextContent('image/jpeg, image/png');
  });

  it('should disable when disabled prop is true', () => {
    render(<FileUpload onUpload={mockOnUpload} disabled />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});

describe('[UNIT] FileUploadButton', () => {
  const mockOnUpload = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default text', () => {
    render(<FileUploadButton onUpload={mockOnUpload} />);

    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<FileUploadButton onUpload={mockOnUpload}>Select Image</FileUploadButton>);

    expect(screen.getByText('Select Image')).toBeInTheDocument();
  });

  it('should show uploading progress', () => {
    // Mock the hook to return uploading state
    vi.mocked(useFileUpload).mockReturnValue({
      upload: vi.fn(),
      progress: 75,
      status: 'uploading',
      error: null,
      pause: vi.fn(),
      resume: vi.fn(),
      reset: vi.fn(),
      selectedFile: null,
      uploadedUrl: null,
    });

    render(<FileUploadButton onUpload={mockOnUpload} />);

    expect(screen.getByText('Uploading 75%...')).toBeInTheDocument();
  });

  it('should show error message', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      upload: vi.fn(),
      progress: 0,
      status: 'error',
      error: new Error('Invalid file type'),
      pause: vi.fn(),
      resume: vi.fn(),
      reset: vi.fn(),
      selectedFile: null,
      uploadedUrl: null,
    });

    render(<FileUploadButton onUpload={mockOnUpload} />);

    expect(screen.getByText('Invalid file type')).toBeInTheDocument();
  });
});
