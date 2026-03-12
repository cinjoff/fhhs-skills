import { Button } from '@/components/ui/button';

export function UsersEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12 text-primary"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Your team starts here</h2>
      <p className="text-muted-foreground text-center max-w-sm mb-8">
        Add your first team member to get started. You can manage roles,
        permissions, and activity all in one place.
      </p>
      <Button size="lg">Add your first user</Button>
    </div>
  );
}
