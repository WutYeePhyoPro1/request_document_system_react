export const tableData = [
  {
    id: 1,
    status: 'Ongoing',
    documentNo: 'BD-2025-001',
    sellNotSell: 'Othre income sell',
    branch: 'Lanthit',
    requestedBy: 'Mr.Kyaw Swar Win',
    createdDate: '2025-10-15',
    modified: '2025-10-15 11:31:27',
  },
  {
    id: 2,
    status: 'Checked',
    documentNo: 'BD-2025-001',
    sellNotSell: 'Othre income sell',
    branch: 'Lanthit',
    requestedBy: 'Mr.Kyaw Swar Win',
    createdDate: '2025-10-15',
    modified: '2025-10-15 11:31:27',
  },
  {
    id: 3,
    status: 'Checked',
    documentNo: 'BD-2025-001',
    sellNotSell: 'Othre income sell',
    branch: 'Lanthit',
    requestedBy: 'Mr.Kyaw Swar Win',
    createdDate: '2025-10-15',
    modified: '2025-10-15 11:31:27',
  },
  // ... Add 12 more 'Checked' rows for a total of 15 rows like in the image
  {
    id: 15,
    status: 'Checked',
    documentNo: 'BD-2025-001',
    sellNotSell: 'Othre income sell',
    branch: 'Lanthit',
    requestedBy: 'Mr.Kyaw Swar Win',
    createdDate: '2025-10-15',
    modified: '2025-10-15 11:31:27',
  },
];

// Replicating the data to match the image count (15 rows total)
const checkedRows = Array.from({ length: 14 }, (_, i) => ({
    id: i + 2,
    status: 'Checked',
    documentNo: 'BD-2025-001',
    sellNotSell: 'Othre income sell',
    branch: 'Lanthit',
    requestedBy: 'Mr.Kyaw Swar Win',
    createdDate: '2025-10-15',
    modified: '2025-10-15 11:31:27',
}));

export const fullTableData = [
    {
      id: 1,
      status: 'Ongoing',
      documentNo: 'BD-2025-001',
      sellNotSell: 'Othre income sell',
      branch: 'Lanthit',
      requestedBy: 'Mr.Kyaw Swar Win',
      createdDate: '2025-10-15',
      modified: '2025-10-15 11:31:27',
    },
    ...checkedRows
];