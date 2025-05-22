"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface UserDropdownProps {
  name?: string;
  email: string;
  onLogout: () => void;
}

// Simple dropdown for user actions (logout, settings, etc.)
export function UserDropdown({ name, email, onLogout }: UserDropdownProps) {
  const [open, setOpen] = useState(false);

  // For accessibility, close dropdown on blur
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div className="relative" tabIndex={0} onBlur={handleBlur}>
      <button
        className="flex items-center space-x-2 px-3 py-1 rounded hover:bg-accent focus:bg-accent focus:outline-none text-sm font-medium border border-border"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        type="button"
      >
        <span>{name || email}</span>
        <svg
          className={`w-4 h-4 transform transition-transform ${open ? "rotate-180" : "rotate-0"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-popover border border-border rounded shadow-lg z-50">
          <Link 
            href="/profile"
            className="block w-full text-left px-4 py-2 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <div className="border-t border-border"></div>
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
