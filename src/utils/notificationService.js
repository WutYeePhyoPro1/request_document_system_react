/**
 * Notification Service for Big Damage Issue Forms
 * 
 * This service provides helper functions to understand and work with notifications
 * in the React frontend. Notifications are automatically created on the backend
 * when forms are submitted or approved.
 * 
 * NOTIFICATION FLOW (MIRRORS LARAVEL LOGIC):
 * ===========================================
 * 
 * 1. Form Created (Status: "Ongoing"):
 *    → Checkers (user_type = 'C') receive notification
 *    → BM Approvers (user_type = 'A1') receive notification
 * 
 * 2. Checker Approves (Status: "Checked"):
 *    → BM Approvers (user_type = 'A1') receive notification
 * 
 * 3. BM Approves (Status: "BM Approved"):
 *    → If total_amount > 500,000: Operation Manager (emp_id: '666-666666') receives notification
 *    → If total_amount ≤ 500,000: Branch Account (user_type = 'ACK') receives notification
 * 
 * 4. Operation Manager Acknowledges (Status: "Ac_Acknowledged"):
 *    → Branch Account (user_type = 'ACK') receives notification
 * 
 * 5. Branch Account Issues (Status: "Completed"):
 *    → Form Creator (originator) receives notification
 */

/**
 * Extract approval users by user type from approvals array
 * 
 * @param {Array} approvals - Array of approval objects from API
 * @param {string} userType - User type to filter ('C', 'A1', 'A2', 'ACK', 'AC', 'OP')
 * @returns {Array} Filtered approval objects
 */
export const getApprovalsByType = (approvals = [], userType) => {
  if (!Array.isArray(approvals)) return [];
  
  return approvals.filter(approval => {
    const approvalUserType = (approval?.user_type || approval?.raw?.user_type || '').toUpperCase();
    return approvalUserType === userType.toUpperCase();
  });
};

/**
 * Get notification recipients for a specific action
 * 
 * @param {Object} params
 * @param {Object} params.formData - Form data object
 * @param {Array} params.approvals - Approval process users array
 * @param {string} params.action - Action type ('create', 'check', 'approve', 'acknowledge', 'issue')
 * @returns {Array} Array of recipient objects with user info and reason
 */
export const getNotificationRecipients = ({ formData = {}, approvals = [], action = 'create' }) => {
  const recipients = [];
  const safeApprovals = Array.isArray(approvals) ? approvals : [];

  try {
    if (action === 'create') {
      // Checkers (C) will be notified
      const checkers = getApprovalsByType(safeApprovals, 'C');
      checkers.forEach(approval => {
        const userId = approval?.admin_id || approval?.raw?.admin_id;
        const userName = approval?.name || approval?.actual_user_name || approval?.raw?.name || 'Unknown';
        if (userId) {
          recipients.push({
            id: userId,
            name: userName,
            role: 'Checker',
            userType: 'C',
            reason: 'Form created - Checker will receive notification',
            branch: approval?.actual_user_branch || approval?.branch || ''
          });
        }
      });

      // BM Approvers (A1) will be notified
      const approvers = getApprovalsByType(safeApprovals, 'A1');
      approvers.forEach(approval => {
        const userId = approval?.admin_id || approval?.raw?.admin_id;
        const userName = approval?.name || approval?.actual_user_name || approval?.raw?.name || 'Unknown';
        if (userId && !recipients.find(r => r.id === userId)) {
          recipients.push({
            id: userId,
            name: userName,
            role: 'BM/ABM Approver',
            userType: 'A1',
            reason: 'Form created - BM Approver will receive notification',
            branch: approval?.actual_user_branch || approval?.branch || ''
          });
        }
      });
    }

    if (action === 'check') {
      // After checking, BM Approvers (A1) will be notified
      const approvers = getApprovalsByType(safeApprovals, 'A1');
      approvers.forEach(approval => {
        const userId = approval?.admin_id || approval?.raw?.admin_id;
        const userName = approval?.name || approval?.actual_user_name || approval?.raw?.name || 'Unknown';
        if (userId) {
          recipients.push({
            id: userId,
            name: userName,
            role: 'BM/ABM Approver',
            userType: 'A1',
            reason: 'Form checked - BM Approver will receive notification',
            branch: approval?.actual_user_branch || approval?.branch || ''
          });
        }
      });
    }

    if (action === 'approve') {
      const totalAmount = Number(
        formData?.total_amount || 
        formData?.general_form?.total_amount || 
        0
      );

      if (totalAmount > 500000) {
        // Operation Manager will be notified
        recipients.push({
          id: '666-666666',
          name: 'Operation Manager',
          role: 'Operation Manager',
          userType: 'OP',
          reason: `Form BM Approved - Operation Manager will receive notification (Amount: ${totalAmount.toLocaleString()} > 500,000)`,
          branch: 'Head Office'
        });
      } else {
        // Branch Account will be notified
        const ackUsers = getApprovalsByType(safeApprovals, 'ACK');
        const acUsers = getApprovalsByType(safeApprovals, 'AC');
        const allAckUsers = [...ackUsers, ...acUsers];
        
        allAckUsers.forEach(approval => {
          const userId = approval?.admin_id || approval?.raw?.admin_id;
          const userName = approval?.name || approval?.actual_user_name || approval?.raw?.name || 'Unknown';
          if (userId) {
            recipients.push({
              id: userId,
              name: userName,
              role: 'Branch Account',
              userType: 'ACK',
              reason: `Form BM Approved - Branch Account will receive notification (Amount: ${totalAmount.toLocaleString()} ≤ 500,000)`,
              branch: approval?.actual_user_branch || approval?.branch || ''
            });
          }
        });
      }
    }

    if (action === 'acknowledge') {
      // After Operation Manager acknowledges, Branch Account will be notified
      const ackUsers = getApprovalsByType(safeApprovals, 'ACK');
      const acUsers = getApprovalsByType(safeApprovals, 'AC');
      const allAckUsers = [...ackUsers, ...acUsers];
      
      allAckUsers.forEach(approval => {
        const userId = approval?.admin_id || approval?.raw?.admin_id;
        const userName = approval?.name || approval?.actual_user_name || approval?.raw?.name || 'Unknown';
        if (userId) {
          recipients.push({
            id: userId,
            name: userName,
            role: 'Branch Account',
            userType: 'ACK',
            reason: 'Form acknowledged - Branch Account will receive notification',
            branch: approval?.actual_user_branch || approval?.branch || ''
          });
        }
      });
    }

    if (action === 'issue' || action === 'complete') {
      // Form creator will be notified
      const originatorId = formData?.user_id || formData?.general_form?.user_id;
      const originatorName = formData?.requester_name || formData?.originator_name || 'Form Creator';
      
      if (originatorId) {
        recipients.push({
          id: originatorId,
          name: originatorName,
          role: 'Form Creator',
          userType: 'Originator',
          reason: 'Form completed - Creator will receive notification',
          branch: formData?.branch_name || formData?.from_branch_name || ''
        });
      }
    }

    return recipients;
  } catch (error) {
    console.error('Error calculating notification recipients:', error);
    return [];
  }
};

/**
 * Format notification message for display
 * 
 * @param {Object} notification - Notification object from API
 * @returns {string} Formatted message
 */
export const formatNotificationMessage = (notification) => {
  const formDocNo = notification?.form_doc_no || notification?.data?.form_doc_no || 'Unknown';
  const status = notification?.status || 'pending';
  
  return `New form ${formDocNo} requires your attention (Status: ${status})`;
};

/**
 * Get notification summary from approvals
 * Shows who has been assigned in the approval process
 * 
 * @param {Array} approvals - Approval process users array
 * @returns {Object} Summary object with recipients grouped by type
 */
export const getNotificationSummary = (approvals = []) => {
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const summary = {
    totalRecipients: 0,
    byUserType: {},
    byStatus: {}
  };

  safeApprovals.forEach(approval => {
    const userType = (approval?.user_type || approval?.raw?.user_type || 'Unknown').toUpperCase();
    const status = approval?.status || 'Pending';
    const adminId = approval?.admin_id || approval?.raw?.admin_id;

    if (!summary.byUserType[userType]) {
      summary.byUserType[userType] = [];
    }

    if (adminId) {
      summary.byUserType[userType].push({
        userId: adminId,
        userName: approval?.actual_user_name || approval?.name || 'Unknown',
        status,
        acted: !!approval?.actual_user_id,
        actedAt: approval?.created_at || approval?.acted_at
      });
      summary.totalRecipients++;
    }

    if (!summary.byStatus[status]) {
      summary.byStatus[status] = 0;
    }
    summary.byStatus[status]++;
  });

  return summary;
};

export default {
  getApprovalsByType,
  getNotificationRecipients,
  formatNotificationMessage,
  getNotificationSummary
};