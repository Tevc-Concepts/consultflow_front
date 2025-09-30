'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { accountingRepository } from '@shared/repositories/accountingRepository';

export default function CountryTemplatesPage() {
  const [country, setCountry] = React.useState('Nigeria');
  const [templates, setTemplates] = React.useState(() => accountingRepository.listTaxTemplates('lagos-ng'));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Country Tax Templates</h1>
      <Card>
        <div className="flex items-center gap-3">
          <select className="border rounded-xl px-3 py-2 text-sm" value={country} onChange={e => setCountry(e.target.value)}>
            <option>Nigeria</option>
            <option>Ghana</option>
            <option>Kenya</option>
          </select>
          <Button onClick={() => setTemplates(accountingRepository.listTaxTemplates('lagos-ng'))}>Load Nigeria Defaults</Button>
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2">Name</th><th className="text-left">Type</th><th className="text-right">Rate %</th></tr></thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-b last:border-0"><td className="py-2">{t.name}</td><td>{t.type}</td><td className="text-right">{t.rate}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
