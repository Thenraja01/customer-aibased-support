import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function ProfileAvatar() {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState(user?.avatar);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { UsersAPI } = await import('@/api/user.api');
      const res = await UsersAPI.uploadAvatar(formData);
      setAvatar(res.data.data.avatar);
    } catch {
      // fail silently
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatar} />
        <AvatarFallback className="text-lg">
          {user?.name?.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <button
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow"
      >
        <Camera size={14} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
