'use client';

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/app/components/ui/card';

interface DashboardCardProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  secondaryAction?: {
    href: string;
    label: string;
  };
}

/**
 * A standardised card component for dashboard displays
 * Provides consistent styling and structure while allowing flexible content
 */
export function DashboardCard({
  title,
  description,
  actionHref,
  actionLabel,
  children,
  className,
  footer,
  secondaryAction,
}: DashboardCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {(actionHref && actionLabel) || footer || secondaryAction ? (
        <CardFooter className={secondaryAction ? 'flex justify-between' : ''}>
          {footer ? (
            footer
          ) : actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full"
            >
              {actionLabel}
            </Link>
          ) : null}
          
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 ml-2"
            >
              {secondaryAction.label}
            </Link>
          )}
        </CardFooter>
      ) : null}
    </Card>
  );
}

/**
 * A placeholder content component for dashboard cards
 * Provides a consistent placeholder style for cards that don't have real content yet
 */
export function PlaceholderContent({ text }: { text: string }) {
  return (
    <div className="h-40 flex items-center justify-center bg-muted/20 rounded-md">
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
