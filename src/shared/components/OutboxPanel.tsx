import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useOutbox } from '@shared/state/outbox';

export default function OutboxPanel() {
    const { items, markSent, remove, clear } = useOutbox();
    const queued = items.filter(i => i.status === 'queued');
    const sent = items.filter(i => i.status === 'sent');

    return (
        <Card>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Outbox</h2>
                {items.length > 0 && <Button size="sm" variant="ghost" onClick={clear}>Clear all</Button>}
            </div>
            {items.length === 0 ? (
                <div className="text-sm text-deep-navy/70">No messages in outbox.</div>
            ) : (
                <div className="space-y-4">
                    {queued.length > 0 && (
                        <section>
                            <h3 className="text-sm font-medium mb-1">Queued</h3>
                            <ul className="space-y-2">
                                {queued.map(m => (
                                    <li key={m.id} className="rounded-xl border border-medium/60 p-2">
                                        <div className="text-sm"><span className="font-medium">To:</span> {m.to}</div>
                                        <div className="text-sm"><span className="font-medium">Subject:</span> {m.subject}</div>
                                        {m.body && <div className="text-xs text-deep-navy/70 mt-1 line-clamp-2">{m.body}</div>}
                                        <div className="mt-2 flex items-center gap-2">
                                            {m.href && <a href={m.href} className="text-xs text-cobalt underline">Open</a>}
                                            <Button size="sm" onClick={() => markSent(m.id)}>Mark sent</Button>
                                            <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>Remove</Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {sent.length > 0 && (
                        <section>
                            <h3 className="text-sm font-medium mb-1">Sent</h3>
                            <ul className="space-y-2">
                                {sent.map(m => (
                                    <li key={m.id} className="rounded-xl border border-medium/60 p-2">
                                        <div className="text-sm"><span className="font-medium">To:</span> {m.to}</div>
                                        <div className="text-sm"><span className="font-medium">Subject:</span> {m.subject}</div>
                                        <div className="text-xs text-deep-navy/70">{new Date(m.ts).toLocaleString()}</div>
                                        {m.href && <a href={m.href} className="text-xs text-cobalt underline">Open</a>}
                                        <div className="mt-2">
                                            <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>Remove</Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}
        </Card>
    );
}
