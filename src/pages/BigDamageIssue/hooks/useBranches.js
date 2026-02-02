import { useState, useEffect, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { canViewAllBranches } from '../../../utils/userAccess';
import { getCurrentUser, getToken } from '../utils/helpers';

export const useBranches = (fetcher) => {
  const token = getToken();
  const [currentUser] = useState(getCurrentUser);
  const [branchOptions, setBranchOptions] = useState([{ value: '', label: 'All Branch' }]);

  const canViewAllBranchesAccess = useMemo(() => canViewAllBranches(currentUser), [currentUser]);

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
    branchList.forEach(b => { if (b?.id) map[b.id] = b.branch_name; });
    return map;
  }, [branchList]);

  useEffect(() => {
    let filteredBranches = branchList;
    
    if (!canViewAllBranchesAccess && currentUser) {
      const userBranches = currentUser.user_branches || currentUser.userBranches || [];
      if (Array.isArray(userBranches) && userBranches.length > 0) {
        const userBranchIds = userBranches.map(ub => ub?.branch_id || ub?.id || ub).filter(Boolean);
        if (userBranchIds.length > 0) {
          filteredBranches = branchList.filter(b => userBranchIds.includes(b.id));
        } else if (currentUser.from_branch_id) {
          filteredBranches = branchList.filter(b => b.id === currentUser.from_branch_id);
        } else {
          filteredBranches = [];
        }
      } else if (currentUser.from_branch_id) {
        filteredBranches = branchList.filter(b => b.id === currentUser.from_branch_id);
      } else {
        filteredBranches = [];
      }
    }
    
    const opts = [
      { value: '', label: 'All Branch' },
      ...filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))
    ];
    setBranchOptions(opts);
  }, [branchList, currentUser, canViewAllBranchesAccess]);

  return {
    branchOptions,
    branchMap,
    branchList,
    canViewAllBranchesAccess,
    currentUser,
  };
};

