import { useState } from 'react';
import { cn } from '@/lib/utils';

interface UserStatusToggleProps {
  currentStatus: string;
  userId: string;
  onToggle: (id: string, newStatus: string) => Promise<void>;
}

export function UserStatusToggle({ currentStatus, userId, onToggle }: UserStatusToggleProps) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    await onToggle(userId, newStatus);
    setToggling(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={cn(
        'px-2 py-1 rounded text-xs font-medium transition-colors',
        currentStatus === 'active'
          ? 'bg-green-500/10 text-green-600 hover:bg-red-500/10 hover:text-red-600'
          : 'bg-red-500/10 text-red-600 hover:bg-green-500/10 hover:text-green-600'
      )}
    >
      {toggling ? '...' : currentStatus === 'active' ? 'Block' : 'Unblock'}
    </button>
  );
}
