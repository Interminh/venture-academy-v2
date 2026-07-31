import { cn } from "@/lib/utils/cn";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const FIELD_BASE =
  "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-ink", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD_BASE, "resize-y", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD_BASE, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-600">{message}</p>;
}
