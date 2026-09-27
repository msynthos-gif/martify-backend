import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const getStatusVariant = (status?: string | null): BadgeVariant => {
  if (!status) return 'neutral';
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'APPROVED':
    case 'ACTIVE':
    case 'DELIVERED':
    case 'RESOLVED':
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
    case 'BOOKED':
    case 'OPEN':
    case 'IN_PROGRESS':
      return 'warning';
    case 'REJECTED':
    case 'BLOCKED':
    case 'CLOSED':
    case 'CANCELLED':
      return 'danger';
    case 'SHIPPING':
    case 'PROCESSING':
      return 'info';
    default:
      return 'neutral';
  }
};

export const formatStatusText = (status?: string | null): string => {
  if (!status) return 'Unknown';
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface StatusBadgeProps {
  status?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  return (
    <Badge variant={getStatusVariant(status)} className={className} size={size}>
      {formatStatusText(status)}
    </Badge>
  );
};
