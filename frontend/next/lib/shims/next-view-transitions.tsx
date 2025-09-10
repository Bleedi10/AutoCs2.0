"use client";

import React from "react";
import NextLink from "next/link";

// Lightweight shim to avoid depending on 'next-view-transitions'.
// - Exports a Link compatible with usage sites by forwarding to next/link
// - Provides a no-op ViewTransitions wrapper for layout-level usage

export const Link = NextLink as unknown as React.FC<any>;

export const ViewTransitions: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

