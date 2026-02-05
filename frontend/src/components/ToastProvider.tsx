"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "rgba(26, 39, 68, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
          backdropFilter: "blur(10px)",
        },
        className: "!rounded-xl",
      }}
      theme="dark"
    />
  );
}
