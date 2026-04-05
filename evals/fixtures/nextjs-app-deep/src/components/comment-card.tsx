import { formatDate } from '@/lib/utils';

interface CommentCardProps {
  comment: {
    id: string;
    body: string;
    content: string;
    createdAt: string;
    author: {
      name: string;
      avatarUrl: string;
    };
  };
}

export function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <img
          src={comment.author.avatarUrl}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full"
        />
        <div>
          <div className="font-medium text-sm">{comment.author.name}</div>
          <div className="text-xs text-gray-500">
            {formatDate(comment.createdAt)}
          </div>
        </div>
      </div>
      <div
        className="text-sm text-gray-700 prose prose-sm"
        dangerouslySetInnerHTML={{ __html: comment.body }}
      />
    </div>
  );
}
