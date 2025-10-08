"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { parseTransactionsFromCsv, parseTransactionsFromExcel } from '@shared/utils/uploadParsers';
import type { JournalTransaction, ExchangeRate } from '@entities/accounting/types';
import CSVTemplateDownload from '@shared/components/CSVTemplateDownload';
import { accountingRepository } from '@shared/repositories/accountingRepository';

export default function TransactionsUploadPage() {
	const params = useParams();
	const companyId = String(params?.id);
		const [transactions, setTransactions] = React.useState<JournalTransaction[]>([]);
		const [persisted, setPersisted] = React.useState<JournalTransaction[]>([]);
		const [periodStart, setPeriodStart] = React.useState('');
		const [periodEnd, setPeriodEnd] = React.useState('');
			const [fxFallback, setFxFallback] = React.useState(false);
	const [currency, setCurrency] = React.useState('NGN');

	React.useEffect(() => {
			accountingRepository.seedDemo();
		// derive currency from CoA if available
		const coa = accountingRepository.listCoA(companyId);
		if (coa[0]?.currency) setCurrency(coa[0].currency);
			setPersisted(accountingRepository.listTransactions(companyId));
	}, [companyId]);

		const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]; if (!file) return;
		if (file.name.toLowerCase().endsWith('.csv')) {
			const text = await file.text();
			setTransactions(parseTransactionsFromCsv(text, companyId, currency));
		} else {
			setTransactions(await parseTransactionsFromExcel(file, companyId, currency));
		}
	};

		const convertIfNeeded = (txn: JournalTransaction): JournalTransaction => {
			if (txn.currency === currency) return txn; // base already
			const date = txn.date.slice(0,10);
			const rateRec = accountingRepository.findRate(companyId, txn.currency as any, date);
			const rate = rateRec?.rate || 1; // fallback 1 if missing
			return {
				...txn,
				originalDebit: txn.debit,
				originalCredit: txn.credit,
				fxRateToBase: rate,
				debit: Math.round(txn.debit * rate * 100) / 100,
				credit: Math.round(txn.credit * rate * 100) / 100,
				currency: currency as any
			};
		};

			const saveUploaded = () => {
			if (transactions.length === 0) return;
				let fallback = false;
				const converted = transactions.map(txn => {
					const rateRec = txn.currency === currency ? null : accountingRepository.findRate(companyId, txn.currency as any, txn.date.slice(0,10));
					if (txn.currency !== currency && !rateRec) fallback = true;
					return convertIfNeeded(txn);
				});
				setFxFallback(fallback);
			accountingRepository.addTransactions(companyId, converted);
			setPersisted(accountingRepository.listTransactions(companyId));
			setTransactions([]);
		};

		const filtered = persisted.filter(t => {
			if (periodStart && t.date < periodStart) return false;
			if (periodEnd && t.date > periodEnd) return false;
			return true;
		});

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-semibold">Transactions Upload</h1>
				{fxFallback && (
					<div className="rounded-lg bg-coral/10 border border-coral/40 px-4 py-2 text-xs text-coral">
						Some uploaded transactions used fallback FX rate (1.0). Configure exchange rates for accurate conversion.
					</div>
				)}
					<Card>
						<div className="flex flex-wrap items-center gap-3">
							<input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-sm" />
							<label className="text-sm">Base Currency</label>
							<select value={currency} onChange={e => setCurrency(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
								{['NGN','USD','CFA','KES','ZAR','GHS','MAD'].map(c => <option key={c} value={c}>{c}</option>)}
							</select>
							<label className="text-sm ml-4">Period</label>
							<input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="border rounded-xl px-2 py-1 text-sm" />
							<span className="text-deep-navy/40">→</span>
								<input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="border rounded-xl px-2 py-1 text-sm" />
							<Button size="sm" onClick={saveUploaded} disabled={transactions.length === 0}>Save {transactions.length || ''}</Button>
							<div className="ml-auto"><CSVTemplateDownload /></div>
						</div>
					</Card>
					{transactions.length > 0 && (
				<Card>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="text-left py-2">Date</th>
									<th className="text-left">Account</th>
									<th className="text-left">Description</th>
									<th className="text-right">Debit</th>
									<th className="text-right">Credit</th>
									<th className="text-left">Currency</th>
								</tr>
							</thead>
							<tbody>
								{transactions.map(txn => (
									<tr key={txn.id} className="border-b last:border-0">
										<td className="py-1">{txn.date}</td>
										<td>{txn.accountCode}</td>
										<td>{txn.description}</td>
										<td className="text-right">{txn.debit.toLocaleString()}</td>
										<td className="text-right">{txn.credit.toLocaleString()}</td>
										<td>{txn.currency}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}
					<Card>
						<h2 className="font-medium mb-2 text-sm">Saved Transactions</h2>
						<div className="overflow-x-auto max-h-96">
							<table className="w-full text-xs">
								<thead>
									<tr className="border-b">
										<th className="text-left py-1">Date</th>
										<th className="text-left">Account</th>
										<th className="text-left">Description</th>
										<th className="text-right">Debit (Base)</th>
										<th className="text-right">Credit (Base)</th>
										<th className="text-left">Orig</th>
										<th className="text-left">Rate</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map(t => (
										<tr key={t.id} className="border-b last:border-0">
											<td className="py-1">{t.date}</td>
											<td>{t.accountCode}</td>
											<td>{t.description}</td>
											<td className="text-right">{t.debit.toLocaleString()}</td>
											<td className="text-right">{t.credit.toLocaleString()}</td>
											<td>{t.originalDebit || t.originalCredit ? `${(t.originalDebit||0)-(t.originalCredit||0)}` : ''}</td>
											<td>{t.fxRateToBase || ''}</td>
										</tr>
									))}
									{filtered.length === 0 && (
										<tr><td colSpan={7} className="text-center py-4 text-deep-navy/50">No transactions in range</td></tr>
									)}
								</tbody>
							</table>
						</div>
					</Card>
		</div>
	);
}