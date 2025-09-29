'use client';

import React from 'react';
import { Block, BlockKind } from '../types';
import { DataSource, DataBinding, dataSources, dataBindingService } from '../services/dataBindingService';
import { useAppStore } from '@shared/state/app';
import getApi from '@shared/api/client';

interface CompanyData {
  id: string;
  name: string;
  currency?: string;
}

interface BlockPropertiesPanelProps {
  block: Block | null;
  onUpdateBlock: (updater: (block: Block) => Block) => void;
}

export default function BlockPropertiesPanel({ block, onUpdateBlock }: BlockPropertiesPanelProps) {
  const [companies, setCompanies] = React.useState<CompanyData[]>([]);
  const [loadingCompanies, setLoadingCompanies] = React.useState(false);
  
  const [binding, setBinding] = React.useState<DataBinding | null>(
    block?.binding ? { sourceId: block.binding, companyId: undefined } : null
  );

  // Load companies on mount
  React.useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const api = getApi();
      const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
      const endpoint = dataSource === 'demo' ? '/api/demo/companies' : 
                     dataSource === 'localDb' ? '/api/local/companies' : 
                     '/api/companies';
      
      const response = await api.get(endpoint);
      const companiesData = response.data.items || response.data || [];
      setCompanies(companiesData);
    } catch (error) {
      console.error('Failed to load companies:', error);
      // Fallback to empty array
    } finally {
      setLoadingCompanies(false);
    }
  };
  const [previewData, setPreviewData] = React.useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);

  // Filter data sources by block type
  const availableDataSources = React.useMemo(() => {
    if (!block) return [];
    
    return dataSources.filter(source => {
      switch (block.kind) {
        case 'kpis':
          return source.type === 'kpis';
        case 'chart':
          return source.type === 'chart';
        case 'table':
          return source.type === 'table';
        default:
          return true;
      }
    });
  }, [block]);

  const handleBindingChange = async (updates: Partial<DataBinding>) => {
    if (!block || !binding) return;

    const newBinding = { ...binding, ...updates };
    setBinding(newBinding);

    // Update the block with the new binding
    onUpdateBlock(prev => ({
      ...prev,
      binding: newBinding.sourceId as any
    }));

    // Fetch preview data
    await loadPreviewData(newBinding);
  };

  const loadPreviewData = async (bindingToUse: DataBinding) => {
    setIsLoadingPreview(true);
    try {
      const data = await dataBindingService.bindData(bindingToUse);
      setPreviewData(data);
      
      // Update block with actual data
      onUpdateBlock(prev => ({
        ...prev,
        data: data
      }));
    } catch (error) {
      console.error('Failed to load preview data:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleUnbind = () => {
    if (!block) return;
    
    setBinding(null);
    setPreviewData(null);
    
    onUpdateBlock(prev => ({
      ...prev,
      binding: 'none' as any,
      data: {}
    }));
  };

  if (!block) {
    return (
      <div className="w-80 bg-white border-l border-medium/40 p-6">
        <div className="text-center text-deep-navy/60 mt-12">
          <div className="text-2xl mb-2">⚙️</div>
          <p className="text-sm">Select a block to configure its properties</p>
        </div>
      </div>
    );
  }

  const selectedSource = availableDataSources.find(s => s.id === binding?.sourceId);

  return (
    <div className="w-80 bg-white border-l border-medium/40 p-6 overflow-y-auto">
      <div className="mb-6">
        <h3 className="font-semibold text-deep-navy mb-2">Block Properties</h3>
        <div className="text-sm text-deep-navy/70 bg-light/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wide text-deep-navy/50">Type</span>
          </div>
          <span className="font-medium capitalize">{block.kind}</span>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-deep-navy mb-3">Data Binding</h4>
        
        {!binding ? (
          <div className="space-y-3">
            <div className="text-sm text-deep-navy/70 mb-3">
              Connect this block to a live data source for real-time updates.
            </div>
            <div className="space-y-2">
              {availableDataSources.map(source => (
                <button
                  key={source.id}
                  onClick={() => setBinding({ sourceId: source.id })}
                  className="w-full text-left p-3 border border-medium/60 rounded-lg hover:border-cobalt/50 hover:bg-cobalt/5 transition-colors"
                >
                  <div className="font-medium text-sm text-deep-navy">{source.name}</div>
                  <div className="text-xs text-deep-navy/70 mt-1">{source.description}</div>
                  {source.requiresCompany && (
                    <div className="text-xs text-amber-600 mt-1">Requires company selection</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-cobalt/5 border border-cobalt/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-deep-navy">{selectedSource?.name}</span>
                <button
                  onClick={handleUnbind}
                  className="text-xs text-coral hover:bg-coral/10 px-2 py-1 rounded"
                >
                  Unbind
                </button>
              </div>
              <div className="text-xs text-deep-navy/70">{selectedSource?.description}</div>
            </div>

            {selectedSource?.requiresCompany && (
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Company
                </label>
                <select
                  value={binding.companyId || ''}
                  onChange={(e) => handleBindingChange({ companyId: e.target.value || undefined })}
                  className="w-full p-2 text-sm border border-medium/60 rounded-lg focus:outline-none focus:border-cobalt"
                >
                  <option value="">Select a company...</option>
                  {companies.map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Calculation
              </label>
              <select
                value={binding.calculation || 'none'}
                onChange={(e) => handleBindingChange({ calculation: e.target.value as any })}
                className="w-full p-2 text-sm border border-medium/60 rounded-lg focus:outline-none focus:border-cobalt"
              >
                <option value="none">None</option>
                <option value="sum">Sum</option>
                <option value="average">Average</option>
                <option value="change">Change (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Format
              </label>
              <select
                value={binding.format || 'number'}
                onChange={(e) => handleBindingChange({ format: e.target.value as any })}
                className="w-full p-2 text-sm border border-medium/60 rounded-lg focus:outline-none focus:border-cobalt"
              >
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Period
              </label>
              <select
                value={binding.period || 'current'}
                onChange={(e) => handleBindingChange({ period: e.target.value as any })}
                className="w-full p-2 text-sm border border-medium/60 rounded-lg focus:outline-none focus:border-cobalt"
              >
                <option value="current">Current Period</option>
                <option value="previous">Previous Period</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>

            <button
              onClick={() => loadPreviewData(binding)}
              disabled={isLoadingPreview || (selectedSource?.requiresCompany && !binding.companyId)}
              className="w-full py-2 px-4 bg-cobalt text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingPreview ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        )}
      </div>

      {previewData && (
        <div className="mb-6">
          <h4 className="font-medium text-deep-navy mb-3">Data Preview</h4>
          <div className="bg-light/50 border border-medium/40 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="text-xs font-mono text-deep-navy/70">
              {typeof previewData === 'object' ? (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              ) : (
                String(previewData)
              )}
            </div>
          </div>
        </div>
      )}

      {block.kind === 'narrative' && (
        <div className="mb-6">
          <h4 className="font-medium text-deep-navy mb-3">Content</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-1">
                Title
              </label>
              <input
                type="text"
                value={block.data.title || ''}
                onChange={(e) => onUpdateBlock(prev => ({
                  ...prev,
                  data: { ...prev.data, title: e.target.value }
                }))}
                className="w-full p-2 text-sm border border-medium/60 rounded-lg focus:outline-none focus:border-cobalt"
                placeholder="Enter title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-1">
                Body
              </label>
              <textarea
                value={block.data.body || ''}
                onChange={(e) => onUpdateBlock(prev => ({
                  ...prev,
                  data: { ...prev.data, body: e.target.value }
                }))}
                rows={4}
                className="w-full p-2 text-sm border border-medium/60 rounded-lg focus:outline-none focus:border-cobalt resize-none"
                placeholder="Enter content..."
              />
            </div>
          </div>
        </div>
      )}

      {block.kind === 'chart' && !binding && (
        <div className="mb-6">
          <h4 className="font-medium text-deep-navy mb-3">Chart Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-1">
                Chart Type
              </label>
              <select
                value={block.data.type || 'bar'}
                onChange={(e) => onUpdateBlock(prev => ({
                  ...prev,
                  data: { ...prev.data, type: e.target.value }
                }))}
                className="w-full p-2 text-sm border border-medium/60 rounded-lg focus:outline-none focus:border-cobalt"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-1">
                Title
              </label>
              <input
                type="text"
                value={block.data.title || ''}
                onChange={(e) => onUpdateBlock(prev => ({
                  ...prev,
                  data: { ...prev.data, title: e.target.value }
                }))}
                className="w-full p-2 text-sm border border-medium/60 rounded-lg focus:outline-none focus:border-cobalt"
                placeholder="Enter chart title..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}