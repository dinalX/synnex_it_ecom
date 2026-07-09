"use client";

import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: "var(--white)",
          borderRadius: "12px",
          width: "min(800px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow)",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          padding: "24px", 
          borderBottom: "1px solid var(--line)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{title}</h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: "transparent", 
              border: "none", 
              fontSize: "1.5rem", 
              cursor: "pointer", 
              color: "var(--muted)" 
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: "24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
