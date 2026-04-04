import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-700/50 flex items-center justify-center text-gold-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-ivory-200 mb-2">{title}</h3>
      <p className="text-sm text-ivory-400 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
