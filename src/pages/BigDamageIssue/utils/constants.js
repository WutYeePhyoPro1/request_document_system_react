export const STATUS_OPTIONS = [
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'Checked', label: 'Checked' },
  { value: 'BM Approved', label: 'BM Approved' },
  { value: 'Ac_Acknowledged', label: 'OP Approved' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancel', label: 'Cancel' },
];

export const STATUS_COLORS = {
  'Ongoing': { bg: '#fbb193', text: '#e1341e' },
  'Checked': { bg: '#fedec3', text: '#fb923c' },
  'BM Approved': { bg: '#ffeaab', text: '#e6ac00' },
  'BMApproved': { bg: '#ffeaab', text: '#e6ac00' },
  'OPApproved': { bg: '#e9f9cf', text: '#a3e635' },
  'OP Approved': { bg: '#e9f9cf', text: '#a3e635' },
  'Approved': { bg: '#e9f9cf', text: '#a3e635' },
  'Ac_Acknowledge': { bg: '#e9f9cf', text: '#a3e635' },
  'Ac_Acknowledged': { bg: '#e9f9cf', text: '#a3e635' },
  'Acknowledged': { bg: '#e9f9cf', text: '#a3e635' },
  'Completed': { bg: '#adebbb', text: '#28a745' },
  'Issued': { bg: '#adebbb', text: '#28a745' },
  'SupervisorIssued': { bg: '#adebbb', text: '#28a745' },
  'Cancel': { bg: '#fda19d', text: '#f91206' },
  'Cancelled': { bg: '#fda19d', text: '#f91206' },
};

export const ROLE_ID_MAP = {
  1: 'User',
  2: 'Checker',
  3: 'Approver',
  4: 'Super-Admin',
  5: 'Acknowledge',
  6: 'Recorder',
  7: 'Branch Account',
  8: 'Branch IT',
  9: 'Branch HR',
  10: 'Supervisor'
};

export const STATUS_ORDER = {
  'ongoing': 1,
  'checked': 2,
  'bm approved': 3,
  'bmapproved': 3,
  'opapproved': 4,
  'op approved': 4,
  'ac_acknowledged': 5,
  'acknowledged': 5,
  'completed': 6,
  'issued': 6,
  'supervisorissued': 6
};

export const OP_THRESHOLD = 500000;
export const PAGE_SIZE = 15;
export const BIG_DAMAGE_FORM_ID = 8;

