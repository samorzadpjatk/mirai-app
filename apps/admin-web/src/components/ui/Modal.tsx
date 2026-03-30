"use client";

import type { ReactNode } from "react";
import { IoClose } from "react-icons/io5";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, onClose }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-lg border border-border-subtle bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          {title ? (
            <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-secondary transition hover:bg-white-10 hover:text-text-primary"
          >
            <IoClose size={20} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
