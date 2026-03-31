"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "./Input";

interface TimeInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  error?: string;
}

export function TimeInput(props: TimeInputProps) {
  return <Input type="time" {...props} />;
}
