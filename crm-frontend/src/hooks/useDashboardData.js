import { useState, useEffect, useCallback } from 'react';
import { interactionService, leadService, churnService } from '../api/api';

export function useDashboardData() {
  const [followUps, setFollowUps] = useState([]);
  const [newLeads, setNewLeads] = useState([]);
  const [churnAlerts, setChurnAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [fuRes, nlRes, chRes] = await Promise.all([
        interactionService.listUpcoming({ page: 1, pageSize: 20 }),
        leadService.list({ page: 1, pageSize: 20, stage: 'INQUIRY' }),
        churnService.getReport(),
      ]);
      setFollowUps(fuRes?.data?.items || []);
      setNewLeads(nlRes?.data?.items || []);
      setChurnAlerts(chRes?.data?.atRiskCustomers || []);
    } catch (err) {
      setError(err.message || 'خطا در دریافت اطلاعات');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  return { followUps, newLeads, churnAlerts, loading, error, refresh: fetchAll };
}