interface UserAvatarProps {
  user: {
    name: string;
    avatarUrl?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
};

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt="avatar"
        className={`rounded-full object-cover ${sizeClasses[size]}`}
      />
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
}
