#!/bin/bash
sed -i 's/export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {/export function AuthModal({ isOpen, onClose, defaultView = "login" }: { isOpen: boolean; onClose: () => void; defaultView?: "login" | "signup" }) {/' frontend/src/components/AuthModal.tsx
sed -i 's/setView("login");/setView(defaultView);/' frontend/src/components/AuthModal.tsx
