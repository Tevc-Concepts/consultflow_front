'use client';

import React, { useState } from 'react';
import { DrillDownData, TransactionDetail } from '../services/liveDataService';
import Modal from '@components/ui/Modal';
import Button from '@components/ui/Button';

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: DrillDownData;
    companyName: string;
    formatCurrency: (amount: number) => string;
}

export default function DrillDownModal({
    isOpen,
    onClose,
    data,
    companyName,
    formatCurrency
}: DrillDownModalProps) {
    const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());

    const toggleChild = (accountCode: string) => {
        const newExpanded = new Set(expandedChildren);
        if (newExpanded.has(accountCode)) {
            newExpanded.delete(accountCode);
        } else {
            newExpanded.add(accountCode);
        }
        setExpandedChildren(newExpanded);
    };

    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()} title="Account Details">
            <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Account Header */}
                <div className="bg-light/50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-deep-navy mb-2">
                        {data.account_name} ({data.account_code})
                    </h3>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-deep-navy/70">
                            Company: {companyName}
                        </span>
                        <span className={[
                            'text-lg font-semibold',
                            data.balance >= 0 ? 'text-emerald' : 'text-coral'
                        ].join(' ')}>
                            {formatCurrency(data.balance)}
                        </span>
                    </div>
                </div>

                {/* Child Accounts */}
                {data.children && data.children.length > 0 && (
                    <div>
                        <h4 className="text-md font-semibold mb-3">Sub-Accounts</h4>
                        <div className="space-y-2">
                            {data.children.map((child) => (
                                <div key={child.account_code} className="border border-medium/40 rounded-xl overflow-hidden">
                                    <button
                                        className="w-full flex items-center justify-between p-3 hover:bg-medium/20 transition-colors"
                                        onClick={() => toggleChild(child.account_code)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className={[
                                                    'h-4 w-4 transition-transform text-deep-navy/70',
                                                    expandedChildren.has(child.account_code) ? 'rotate-90' : ''
                                                ].join(' ')}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            <span className="font-medium">{child.account_name}</span>
                                        </div>
                                        <span className={[
                                            'font-semibold',
                                            child.balance >= 0 ? 'text-emerald' : 'text-coral'
                                        ].join(' ')}>
                                            {formatCurrency(child.balance)}
                                        </span>
                                    </button>
                                    
                                    {expandedChildren.has(child.account_code) && (
                                        <div className="border-t border-medium/40 bg-light/30">
                                            <TransactionList 
                                                transactions={child.transactions}
                                                formatCurrency={formatCurrency}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transactions */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-semibold">Transactions</h4>
                        <span className="text-sm text-deep-navy/70">
                            {data.transactions.length} records
                        </span>
                    </div>
                    
                    <TransactionList 
                        transactions={data.transactions}
                        formatCurrency={formatCurrency}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-medium/40">
                    <Button onClick={onClose} variant="primary">
                        Close
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            // Export functionality
                            const csvData = data.transactions.map(txn => ({
                                Date: txn.date,
                                Reference: txn.reference,
                                Description: txn.description,
                                Debit: txn.debit,
                                Credit: txn.credit,
                                Balance: txn.balance
                            }));
                            
                            const csv = [
                                Object.keys(csvData[0] || {}).join(','),
                                ...csvData.map(row => Object.values(row).join(','))
                            ].join('\n');
                            
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${data.account_code}-transactions.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        Export CSV
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

interface TransactionListProps {
    transactions: TransactionDetail[];
    formatCurrency: (amount: number) => string;
}

function TransactionList({ transactions, formatCurrency }: TransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-deep-navy/60">
                <div className="text-2xl mb-2">📊</div>
                <p>No transactions found</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-medium/40">
                        <th className="text-left py-2 px-3 font-semibold">Date</th>
                        <th className="text-left py-2 px-3 font-semibold">Reference</th>
                        <th className="text-left py-2 px-3 font-semibold">Description</th>
                        <th className="text-right py-2 px-3 font-semibold">Debit</th>
                        <th className="text-right py-2 px-3 font-semibold">Credit</th>
                        <th className="text-right py-2 px-3 font-semibold">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((txn, index) => (
                        <tr key={txn.id} className="border-b border-medium/20 hover:bg-medium/10">
                            <td className="py-2 px-3">
                                {new Date(txn.date).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">
                                {txn.reference}
                            </td>
                            <td className="py-2 px-3 max-w-48 truncate" title={txn.description}>
                                {txn.description}
                            </td>
                            <td className="py-2 px-3 text-right">
                                {txn.debit > 0 ? (
                                    <span className="text-emerald">{formatCurrency(txn.debit)}</span>
                                ) : (
                                    <span className="text-deep-navy/40">—</span>
                                )}
                            </td>
                            <td className="py-2 px-3 text-right">
                                {txn.credit > 0 ? (
                                    <span className="text-coral">{formatCurrency(txn.credit)}</span>
                                ) : (
                                    <span className="text-deep-navy/40">—</span>
                                )}
                            </td>
                            <td className="py-2 px-3 text-right font-medium">
                                <span className={txn.balance >= 0 ? 'text-emerald' : 'text-coral'}>
                                    {formatCurrency(txn.balance)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}