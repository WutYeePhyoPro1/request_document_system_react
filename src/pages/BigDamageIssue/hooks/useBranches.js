import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { getToken } from '../utils/helpers';

export const useBranches = (fetcher) => {
  const token = getToken();

  const { data: branchesPayload } = useSWRImmutable(
    token ? ['/api/branches'] : null,
    ([url]) => fetcher(url)
  );

  const branchList = useMemo(() => {
    const json = branchesPayload || {};
    return Array.isArray(json) ? json
      : Array.isArray(json?.data) ? json.data
      : Array.isArray(json?.data?.data) ? json.data.data
      : [];
  }, [branchesPayload]);

  const branchMap = useMemo(() => {
    const map = {};
    branchList.forEach(b => {
      if (b?.id == null) return;
      const name = b.branch_name || b.name || b.branch_short_name;
      if (name) {
        map[b.id] = name;
        map[String(b.id)] = name;
      }
    });
    return map;
  }, [branchList]);

  const branchOptions = useMemo(() => {
    return [
      { value: '', label: 'All Branch' },
      ...branchList.map(b => ({ value: b.id, label: b.branch_name }))
    ];
  }, [branchList]);

  return {
    branchOptions,
    branchMap,
    branchList,
  };
};

