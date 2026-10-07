"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Friend = { username: string; displayName: string | null };

export function FriendMentions({ text, onChange }: { text: string; onChange: (value: string) => void }) {
  const query = /(?:^|\s)@([A-Za-z0-9_]*)$/.exec(text)?.[1];
  const [result, setResult] = useState<{ query: string; friends: Friend[] }>({ query: "", friends: [] });
  useEffect(() => {
    if (query === undefined) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/stream/friends?accepted=1&search=${encodeURIComponent(query.toLowerCase())}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : { users: [] })
        .then((data: { users: Friend[] }) => setResult({ query, friends: data.users }))
        .catch(() => {});
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  if (query === undefined) return null;
  const friends = result.query === query ? result.friends : [];
  return <div className="max-h-44 overflow-auto border border-rule-hi bg-panel-hi" role="listbox" aria-label="Tag teman">
    {friends.length ? friends.map((friend) => <button type="button" key={friend.username} onClick={() => onChange(text.replace(/@([A-Za-z0-9_]*)$/, `@${friend.username} `))} className="flex min-h-10 w-full items-center gap-2 border-b border-rule px-3 text-left text-xs hover:bg-panel"><strong className="text-cyan">@{friend.username}</strong><span className="truncate text-ink">{friend.displayName}</span></button>) : <p className="px-3 py-2 text-xs text-dim">Cari teman yang sudah terhubung untuk ditag.</p>}
  </div>;
}

export function MentionText({ text }: { text: string }) {
  return <>{text.split(/(@[A-Za-z0-9_]{3,30}\b)/g).map((part, index) => part.startsWith("@") && /^@[A-Za-z0-9_]{3,30}$/.test(part)
    ? <Link key={index} href={`/stream/user/${encodeURIComponent(part.slice(1))}`} className="font-bold text-cyan hover:underline">{part}</Link>
    : <span key={index}>{part}</span>)}</>;
}
