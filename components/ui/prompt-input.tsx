"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full items-end gap-3 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:border-blue-300 transition-all duration-200",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex-1 resize-none bg-transparent text-base placeholder:text-gray-500 focus:outline-none leading-relaxed",
        className,
      )}
      rows={1}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PromptInputActions = React.forwardRef<
  HTMLDivElement,
  PromptInputActionsProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
});
PromptInputActions.displayName = "PromptInputActions";

interface PromptInputActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string;
  children: React.ReactNode;
}

const PromptInputAction = React.forwardRef<
  HTMLButtonElement,
  PromptInputActionProps
>(({ className, tooltip, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
});
PromptInputAction.displayName = "PromptInputAction";

export {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
};
