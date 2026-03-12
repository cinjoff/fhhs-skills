'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export function CommentCard({ comment }: { comment: Comment }) {
  // VULNERABILITY: XSS via dangerouslySetInnerHTML with user-provided content
  return (
    <div className="rounded-lg border p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-sm">{comment.author}</span>
        <span className="text-xs text-slate-500">{comment.createdAt}</span>
      </div>
      <div
        className="prose prose-sm"
        dangerouslySetInnerHTML={{ __html: comment.content }}
      />
    </div>
  );
}

export function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    fetch(`/api/comments?postId=${postId}`)
      .then((res) => res.json())
      .then((data) => setComments(data));
  }, [postId]);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Comments</h3>
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
