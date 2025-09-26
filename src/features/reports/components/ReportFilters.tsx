'use client';

import React from 'react';
import { ReportFilters, Transaction } from '../types';

interface ReportFiltersProps {
    filters: ReportFilters;
    onUpdateFilters: (updates: Partial<ReportFilters>) => void;
    onClearFilters: () => void;
}

export default function ReportFiltersComponent({ 
    filters, 
    onUpdateFilters, 
    onClearFilters 
}: ReportFiltersProps) {
    return (
        <div className="border-b border-medium/60 pb-3 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div>
                    <label htmlFor="pl-search" className="sr-only">Search transactions</label>
                    <input
                        id="pl-search"
                        value={filters.query}
                        onChange={(e) => onUpdateFilters({ query: e.target.value })}
                        placeholder="Search transactions"
                        className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    />
                </div>

                {/* Amount Range */}
                <div className="flex gap-2">
                    <input
                        id="pl-min"
                        type="number"
                        inputMode="numeric"
                        value={filters.minAmount}
                        onChange={(e) => onUpdateFilters({ minAmount: e.target.value })}
                        placeholder="Min"
                        className="w-24 rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    />
                    <input
                        id="pl-max"
                        type="number"
                        inputMode="numeric"
                        value={filters.maxAmount}
                        onChange={(e) => onUpdateFilters({ maxAmount: e.target.value })}
                        placeholder="Max"
                        className="w-24 rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    />
                </div>

                {/* Account Filter */}
                <select
                    value={filters.account}
                    onChange={(e) => onUpdateFilters({ account: e.target.value as Transaction['account'] | 'All' })}
                    className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                >
                    <option value="All">All Accounts</option>
                    <option value="Sales">Sales</option>
                    <option value="COGS">COGS</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Rent">Rent</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                </select>

                {/* Type Filter */}
                <select
                    value={filters.type}
                    onChange={(e) => onUpdateFilters({ type: e.target.value as Transaction['type'] | 'All' })}
                    className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                >
                    <option value="All">All Types</option>
                    <option value="Revenue">Revenue</option>
                    <option value="COGS">COGS</option>
                    <option value="Expense">Expense</option>
                </select>

                {/* Clear Button */}
                <button
                    onClick={onClearFilters}
                    className="px-3 py-2 text-sm text-deep-navy/70 hover:text-deep-navy border border-medium/60 rounded-xl hover:bg-medium/30 transition-colors"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}