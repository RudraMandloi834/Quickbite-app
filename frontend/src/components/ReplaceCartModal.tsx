"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./Button";
import { CartDisplay } from "@/types/cart";
import { MenuItem, Restaurant } from "@/types/restaurant";

interface ReplaceCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentCart: CartDisplay | null;
  newRestaurant: Restaurant | null;
  newItem: MenuItem | null;
  isReplacing: boolean;
}

export function ReplaceCartModal({
  isOpen,
  onClose,
  onConfirm,
  currentCart,
  newRestaurant,
  newItem,
  isReplacing,
}: ReplaceCartModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  const currentItemCount = currentCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-brand-fg/20 backdrop-blur-md transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={() => !isReplacing && onClose()}
      />

      {/* Modal */}
      <div 
        className={`relative w-full max-w-md bg-brand-card rounded-2xl shadow-2xl border border-brand-border/60 overflow-hidden flex flex-col transition-all duration-300 transform ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          
          <h2 id="modal-title" className="text-2xl font-serif font-semibold text-brand-fg text-center mb-3">
            Replace your cart with {newRestaurant?.name}?
          </h2>
          
          <p className="text-brand-muted text-center text-sm sm:text-base mb-8">
            <span className="block font-medium text-brand-fg mb-1">Your cart has items from another restaurant.</span>
            Your QuickBite cart can only include items from one restaurant at a time. Your current items will be removed and the selected item will be added.
          </p>

          <div className="space-y-4 bg-stone-50/50 p-4 rounded-xl border border-brand-border/40">
            {/* Current Cart */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border border-brand-border/50 shrink-0">
                  {/* Subtle placeholder/avatar for restaurant */}
                  <div className="w-full h-full flex items-center justify-center bg-brand-fg text-brand-bg font-serif text-sm">
                    {currentCart?.restaurantName.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-brand-muted font-medium mb-0.5 uppercase tracking-wider">Current Cart</p>
                  <p className="font-medium text-brand-fg text-sm">{currentCart?.restaurantName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-brand-muted bg-white px-2.5 py-1 rounded-md border border-brand-border/60">
                  {currentItemCount} {currentItemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>

            <div className="flex justify-center py-1">
              <svg className="w-5 h-5 text-brand-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* New Cart */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary overflow-hidden border border-brand-primary/20 shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-white font-serif text-sm">
                    {newRestaurant?.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-brand-primary font-medium mb-0.5 uppercase tracking-wider">New Restaurant</p>
                  <p className="font-medium text-brand-fg text-sm">{newRestaurant?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-brand-primary bg-brand-primary/5 px-2.5 py-1 rounded-md border border-brand-primary/20">
                  Add {newItem?.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 sm:px-8 pb-8 space-y-3">
          <Button
            variant="primary"
            className="w-full h-12 text-base shadow-sm relative overflow-hidden"
            onClick={onConfirm}
            disabled={isReplacing}
          >
            {isReplacing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Replacing cart...
              </span>
            ) : (
              "Replace & Add"
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium"
            onClick={onClose}
            disabled={isReplacing}
          >
            Keep My Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
