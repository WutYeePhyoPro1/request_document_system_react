export const ROLE_ID_MAP = new Map([
  [2, 'branch_lp'],
  [3, 'bm'],
  [4, 'op_manager'],
  [5, 'op_manager'],
  [7, 'account'],
  [8, 'account'],
  [10, 'supervisor'],
]);

export const OP_THRESHOLD = 500000;

export const STATUS_ORDER = {
  ongoing: 1,
  checked: 2,
  'bm approved': 3,
  bmapproved: 3,
  opapproved: 4,
  'op approved': 4,
  ac_acknowledged: 5,
  acknowledged: 5,
  completed: 6,
  issued: 6,
  supervisorissued: 6,
};

export const ACTION_LABELS = {
  BMApprovedMem: 'Check',
  BMApproved: 'Approve (BM)',
  OPApproved: 'Approve (OP)',
  Ac_Acknowledged: 'Approve (OP)',
  SupervisorIssued: 'Issue',
  Completed: 'Issue',
};

export const ROLE_KEYS = [
  'user_type', 'userType', 'position', 'designation', 'role_id', 'roleId',
  'role', 'role_name', 'roleName', 'user_role', 'userRole', 'role_type', 
  'roleType', 'type', 'roles', 'user_roles',
];

export const NESTED_KEYS = [
  'user_type', 'userType', 'name', 'role', 'role_name', 'roleName', 'type', 'code', 'title',
];

