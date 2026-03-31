"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "./Input";

interface DateInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  error?: string;
}

export function DateInput(props: DateInputProps) {
  return <Input type="date" {...props} />;
}
