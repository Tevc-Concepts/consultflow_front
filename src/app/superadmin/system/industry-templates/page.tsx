'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { accountingRepository, buildCoATree } from '@shared/repositories/accountingRepository';

export default function IndustryTemplatesPage() {
  const [industry, setIndustry] = React.useState('Services');
  const [coa, setCoa] = React.useState(() => accountingRepository.listCoA('lagos-ng'));
  const tree = React.useMemo(() => buildCoATree(coa), [coa]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Industry CoA Templates</h1>
      <Card>
        <div className="flex items-center gap-3">
          <select className="border rounded-xl px-3 py-2 text-sm" value={industry} onChange={e => setIndustry(e.target.value)}>
            <option>Services</option>
            <option>Retail</option>
            <option>Manufacturing</option>
          </select>
          <Button onClick={() => setCoa(accountingRepository.listCoA('lagos-ng'))}>Load Sample Nigeria CoA</Button>
        </div>
      </Card>
      <Card>
        <ul className="pl-3 border-l border-medium/60">
          {tree.map(n => (
            <li key={n.id} className="py-1"><span className="mr-2 text-deep-navy/60">{n.accountCode}</span>{n.accountName}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
