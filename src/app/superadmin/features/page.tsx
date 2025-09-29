'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSuperAdminStore } from '../../../features/superadmin/store';
import { Consultant } from '../../../features/superadmin/store';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { showToast } from '../../../shared/components/Toast';
import Spinner from '../../../shared/components/Spinner';

export default function SuperAdminFeaturesPage() {
  const featureFlags = useSuperAdminStore((state) => state.featureFlags);
  const consultants = useSuperAdminStore((state) => state.consultants);
  const updateFeatureFlag = useSuperAdminStore((state) => state.updateFeatureFlag);
  const fetchFeatureFlags = useSuperAdminStore((state) => state.fetchFeatureFlags);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      if (!fetchFeatureFlags) return;
      setLoading(true);
      try {
        await fetchFeatureFlags();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [fetchFeatureFlags]);

  const handleToggleFeature = async (featureId: string, enabled: boolean) => {
    if (busy[featureId]) return;
    setBusy((s) => ({ ...s, [featureId]: true }));
    if (selectedConsultant === 'all') {
      const ok = await updateFeatureFlag(featureId, enabled, []);
      showToast({ title: ok ? 'Feature Updated' : 'Update Failed', message: ok ? 'Flag updated successfully.' : 'Could not update feature flag.', type: ok ? 'success' : 'error' });
    } else {
      const feature = featureFlags.find(f => f.id === featureId);
      const currentIds = feature?.consultantIds || [];
      const newIds = enabled
        ? [...currentIds, selectedConsultant]
        : currentIds.filter(id => id !== selectedConsultant);
      const ok = await updateFeatureFlag(featureId, feature?.enabled || false, newIds);
      showToast({ title: ok ? 'Feature Updated' : 'Update Failed', message: ok ? 'Consultant assignment updated.' : 'Could not update feature assignment.', type: ok ? 'success' : 'error' });
    }
    setBusy((s) => ({ ...s, [featureId]: false }));
  };

  const isFeatureEnabledForConsultant = (featureId: string, consultantId: string) => {
    const feature = featureFlags.find(f => f.id === featureId);
    if (!feature) return false;

    if (selectedConsultant === 'all') {
      return feature.enabled;
    }

    return feature.consultantIds.includes(consultantId) || feature.enabled;
  };

  const filteredConsultants = selectedConsultant === 'all'
    ? consultants
    : consultants.filter(c => c.id === selectedConsultant);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Feature Flags Management</h1>
      </div>

      {/* Consultant Filter */}
      <Card>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Configure for:</label>
          <select
            value={selectedConsultant}
            onChange={(e) => setSelectedConsultant(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Consultants</option>
            {consultants.map((consultant) => (
              <option key={consultant.id} value={consultant.id}>
                {consultant.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Feature Flags */}
      <div className="space-y-4">
        {loading && (
          <Card>
            <div className="py-8 text-center text-sm text-gray-600">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent mr-2" />
              Loading feature flags…
            </div>
          </Card>
        )}
        {!loading && featureFlags.map((feature) => (
          <Card key={feature.id}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                {selectedConsultant === 'all' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Enabled for: {feature.consultantIds.length > 0
                      ? `${feature.consultantIds.length} specific consultant(s)`
                      : 'All consultants'}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={selectedConsultant === 'all'
                      ? feature.enabled
                      : isFeatureEnabledForConsultant(feature.id, selectedConsultant)
                    }
                    onChange={(e) => handleToggleFeature(feature.id, e.target.checked)}
                    disabled={!!busy[feature.id] || loading}
                  />
                  <div className={`w-11 h-6 ${busy[feature.id] ? 'opacity-60' : ''} bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
                {busy[feature.id] && <span className="ml-2 text-xs text-gray-500"><Spinner size="xs" /></span>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Consultant-Specific Settings */}
      {selectedConsultant !== 'all' && (
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Feature Status for {consultants.find(c => c.id === selectedConsultant)?.name}
          </h3>
          <div className="space-y-3">
            {featureFlags.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">{feature.name}</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  isFeatureEnabledForConsultant(feature.id, selectedConsultant)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isFeatureEnabledForConsultant(feature.id, selectedConsultant) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bulk Actions */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h3>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            Enable All Features
          </Button>
          <Button variant="ghost" size="sm">
            Disable All Features
          </Button>
          <Button variant="ghost" size="sm">
            Reset to Defaults
          </Button>
        </div>
      </Card>
    </div>
  );
}