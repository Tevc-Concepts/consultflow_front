"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { accountingRepository } from '@shared/repositories/accountingRepository';
import type { AuditEvent } from '@entities/accounting/types';

export default function AuditPage() {
  const params = useParams();
  const companyId = String(params?.id);
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [entity, setEntity] = React.useState<string>('all');
  const [action, setAction] = React.useState<string>('all');

  const refresh = React.useCallback(() => {
    setEvents(accountingRepository.listAudit(companyId).sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
  }, [companyId]);

  React.useEffect(() => {
    accountingRepository.seedDemo();
    refresh();
  }, [companyId, refresh]);

  const filtered = events.filter(e => (entity==='all'|| e.entity===entity) && (action==='all'|| e.action===action));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit Trail</h1>
      <Card>
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <label className="text-xs">Entity</label>
          <select value={entity} onChange={e=>setEntity(e.target.value)} className="border rounded-lg px-2 py-1.5">
            <option value="all">All</option>
            <option value="trial_balance">Trial Balance</option>
            <option value="adjustment">Adjustment</option>
            <option value="transaction">Transaction</option>
            <option value="document">Document</option>
            <option value="report">Report</option>
            <option value="ticket">Ticket</option>
          </select>
          <label className="text-xs">Action</label>
          <select value={action} onChange={e=>setAction(e.target.value)} className="border rounded-lg px-2 py-1.5">
            <option value="all">All</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="status_change">Status Change</option>
          </select>
          <Button size="sm" variant="ghost" onClick={refresh}>Refresh</Button>
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Time</th>
                <th className="text-left">Entity</th>
                <th className="text-left">Action</th>
                <th className="text-left">User</th>
                <th className="text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => (
                <tr key={ev.id} className="border-b last:border-0">
                  <td className="py-1">{new Date(ev.timestamp).toLocaleString()}</td>
                  <td>{ev.entity}</td>
                  <td>{ev.action}</td>
                  <td>{(ev as any).meta?.userDisplayName || ev.userId}</td>
                  <td className="truncate max-w-sm">
                    {ev.meta?.note ? <span className="mr-2 italic text-deep-navy/70">{ev.meta.note}</span> : null}
                    {ev.meta?.eventType ? <span className="mr-2 text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-700">{String(ev.meta.eventType)}</span> : null}
                    {ev.changes ? Object.keys(ev.changes).map(k => `${k}: ${JSON.stringify(ev.changes![k].from)}→${JSON.stringify(ev.changes![k].to)}`).join('; ') : ''}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-deep-navy/50">No events</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
