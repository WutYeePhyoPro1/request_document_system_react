import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import '../../components/DamageForm/ButtonHoverEffects.css';

import { StatusBadge, CopyButton, NotificationIcon, EmptyState, Pagination } from './components';
import { 
  formatDateDDMMYY, 
  formatDateTimeDDMMYY, 
  getCurrentUser, 
  extractUserRoleInfo,
  isOpManager,
  isAccountUser,
  isFormRelevantToUser,
  hasUserCompletedAction,
  getTotalAmount,
  normalizeBranch,
} from './utils/helpers';
import { PAGE_SIZE, OP_THRESHOLD } from './utils/constants';

function DamageIssueList({ 
  data = [], 
  loading = false, 
  currentPage = 1, 
  perPage = 15, 
  totalRows = 0, 
  onPageChange, 
  branchMap = {}, 
  productFilter = '', 
  notificationCounts = new Map(), 
  suppressUnreadForFormIds = [],
  notiData = []
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const currentUser = useMemo(() => getCurrentUser(), []);

  const getNotificationCount = (possibleIds = []) => {
    for (const id of possibleIds) {
      const keyStr = String(id);
      let count = notificationCounts?.get?.(keyStr);
        
        if ((count === undefined || count === null) && !isNaN(Number(id))) {
        count = notificationCounts?.get?.(Number(id));
      }
      
      if (count > 0) return { count, matchedFormId: id };
    }
    return { count: 0, matchedFormId: null };
  };

  const suppressedUnreadSet = useMemo(() => {
      return new Set((suppressUnreadForFormIds || []).map(id => String(id)));
  }, [suppressUnreadForFormIds]);

  const isSuppressedForUnread = (row, gf) => {
    const ids = [gf?.id, row?.general_form_id, gf?.general_form_id, row?.id]
      .filter(id => id != null)
      .map(String);
    return ids.some(id => suppressedUnreadSet.has(id));
  };

  const navigateToDetail = (detailId, bigDamageId, generalFormId) => {
    const currentUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('bigDamageIssueReturnUrl', currentUrl);
    navigate(`/big-damage-issue-add/${detailId}`, { 
      state: { bigDamageId, generalFormId, returnPage: currentPage, returnUrl: currentUrl } 
    });
  };

  const productNameFilterLower = productFilter?.toLowerCase().trim() || '';
  
  const formsWithItems = useMemo(() => {
    const formsMap = new Map();
    const rawIssues = Array.isArray(data) ? data : [];
    
    rawIssues.forEach((row) => {
      const formId = row?.general_form?.id || row?.general_form_id || row?.id;
      if (!formId) return;
      
        if (!formsMap.has(formId)) {
          formsMap.set(formId, {
            formId,
            generalForm: row?.general_form,
            items: [],
          formRow: row
          });
        }
      
      const productCode = (row?.product_code || row?.code || row?.productCode || row?.product?.code || '').toString().trim();
      const productName = (row?.product_name || row?.name || row?.productName || row?.product?.name || '').toString().trim();
      
        formsMap.get(formId).items.push({
          product_code: productCode,
          product_name: productName,
          amount: parseFloat(row?.amount || row?.total || 0),
        });
    });
    
    return formsMap;
  }, [data]);
  
  const formTotals = useMemo(() => {
    const totals = new Map();
    formsWithItems.forEach((formData, formId) => {
      const total = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        totals.set(formId, total);
        totals.set(String(formId), total);
    });
    return totals;
  }, [formsWithItems]);
  
  const filteredForms = useMemo(() => {
    let forms = Array.from(formsWithItems.values());
   
    if (productNameFilterLower) {
      forms = forms.filter(formData => {
        const hasMatchingItem = formData.items.some(item => {
          const code = String(item.product_code || '').toLowerCase();
          const name = String(item.product_name || '').toLowerCase();
          return code.includes(productNameFilterLower) || name.includes(productNameFilterLower);
        });
        
        if (!hasMatchingItem && formData.formRow) {
          const rowCode = (formData.formRow?.product_code || formData.formRow?.code || '').toString().toLowerCase();
          const rowName = (formData.formRow?.product_name || formData.formRow?.name || '').toString().toLowerCase();
          return rowCode.includes(productNameFilterLower) || rowName.includes(productNameFilterLower);
        }
        
        return hasMatchingItem;
      });
    }
    
    return forms;
  }, [formsWithItems, productNameFilterLower]);
  
  const seenFormIds = new Set();
  const allFilteredIssues = filteredForms
    .map(formData => formData.formRow)
    .filter((row) => {
      const formId = row?.general_form?.id || row?.general_form_id || row?.id;
      if (!formId || seenFormIds.has(formId)) return false;
    seenFormIds.add(formId);
      return true;
    });
   
  const visibleIssues = useMemo(() => {
    if (!currentUser) return allFilteredIssues;
    
    const statusParam = searchParams.get('status');
    const hasExplicitStatus = statusParam?.trim();
    const hasProductFilter = productFilter?.trim();

    // If there's an explicit status filter, show ALL matching forms (no threshold filter)
    // When filtering explicitly, show all matching forms regardless of threshold
      if (hasExplicitStatus || hasProductFilter) {
      return allFilteredIssues;
      }

    // Default view: Backend already filters forms for OP Manager, so just return what backend sent
    // Backend returns: user's own forms, BM Approved over 500k, OP Approved, Acknowledged, Completed, etc.
    // No need for additional frontend filtering - backend handles it correctly
    return allFilteredIssues;
  }, [allFilteredIssues, currentUser, productFilter, searchParams, formTotals]);

  const effectiveTotalRows = productNameFilterLower ? allFilteredIssues.length : (totalRows || visibleIssues.length);
  const totalPages = Math.max(1, Math.ceil(effectiveTotalRows / PAGE_SIZE));
  const safeCurrentPage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages));

  const dataLen = Array.isArray(data) ? data.length : 0;
  const pagedVisibleIssues = dataLen > 0 && dataLen <= PAGE_SIZE && totalRows > dataLen
    ? visibleIssues
    : visibleIssues.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  const isEmpty = !loading && allFilteredIssues.length === 0;

  const resolveBranchName = (gf, branchInfo) => {
    if (branchInfo.name) return branchInfo.name;
    if (gf?.to_branch_name) return gf.to_branch_name;
    if (gf?.from_branch_name) return gf.from_branch_name;
    if (branchInfo.id != null && branchMap[branchInfo.id]) return branchMap[branchInfo.id];
    if (branchInfo.id != null) return String(branchInfo.id);
    return '-';
  };

  const headers = [
    t('list.columns.no', { defaultValue: 'No' }),
    t('list.columns.status', { defaultValue: 'Status' }),
    t('list.columns.documentNo', { defaultValue: 'Document No' }),
    t('list.columns.sellNotSell', { defaultValue: 'Sell / Not Sell' }),
    t('list.columns.branch', { defaultValue: 'Branch' }),
    t('list.columns.requestedBy', { defaultValue: 'Requested By' }),
    t('list.columns.amount', { defaultValue: 'Amount' }),
    t('list.columns.createdDate', { defaultValue: 'Created Date' }),
    t('list.columns.modified', { defaultValue: 'Modified' }),
  ];

  const renderNotificationBadge = (row, gf) => {
    if (isSuppressedForUnread(row, gf)) {
      return null;
    }
    
    // Simple check like request discount form - directly check notiData array
    if (!Array.isArray(notiData) || notiData.length === 0) {
      return null;
    }

    const formDocNo = gf?.form_doc_no || gf?.general_form?.form_doc_no || gf?.document_number || gf?.doc_no || row?.form_doc_no || row?.document_number || row?.doc_no;
    const formId = gf?.id || row?.general_form_id || gf?.general_form_id || row?.id;
    const generalFormId = gf?.general_form_id || row?.general_form_id;
      
    const hasUnreadNotification = notiData.some((item) => {
      const notiDataItem = item?.data || item;
      const notiFormId = notiDataItem?.specific_form_id || notiDataItem?.general_form_id;
      const notiFormDocNo = notiDataItem?.form_doc_no;
      
      const matchesById = formId && (String(formId) === String(notiFormId) || (generalFormId && String(generalFormId) === String(notiFormId)));
      const matchesByDocNo = formDocNo && formDocNo !== '-' && formDocNo === notiFormDocNo;
      
      // Match by form ID or form document number
      return matchesById || matchesByDocNo;
    });

    if (hasUnreadNotification) {
      return (
        <span
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center"
          title="Unread notification"
        >
          <NotificationIcon className="h-4 w-4 text-red-500" />
        </span>
      );
    }

    return null;
  };

  const renderRow = (row, idx) => {
    const gf = row || {};
                    const detailId = row.id;
    const displayNo = (safeCurrentPage - 1) * PAGE_SIZE + idx + 1;
    
                    const toBranchInfo = normalizeBranch(gf.to_branch || gf.toBranch);
                    const fromBranchInfo = normalizeBranch(gf.from_branch || gf.fromBranch);
    const branchInfo = toBranchInfo.id != null || toBranchInfo.name ? toBranchInfo : fromBranchInfo;
                    const branchName = resolveBranchName(gf, branchInfo);
    
    const formDocNo = gf.form_doc_no || gf.general_form?.form_doc_no || gf.document_number || gf.doc_no || '-';
    
                    const assetType = gf.asset_type || gf.case_type || gf.caseType;
    const isOtherIncomeSell = assetType === 'on' || assetType === 'Other income sell';
                    const sellStatus = isOtherIncomeSell 
                      ? t('list.otherIncomeSell', { defaultValue: 'Other Income Sell' }) 
                      : t('list.notSell', { defaultValue: 'Not Sell' });
                      
    const totalAmount = getTotalAmount(row, gf, formTotals);
    const exceedsThreshold = totalAmount > OP_THRESHOLD;

    return (
                      <tr
                        key={row.id}
                        className="border-b border-gray-200 hover:bg-gray-100 transition duration-150 ease-in-out cursor-pointer"
                        onClick={() => navigateToDetail(detailId, row.id, gf.id || null)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 w-12">
                          {displayNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <StatusBadge status={gf.status || '-'} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
            <span>{formDocNo}</span>
            <span className="whitespace-nowrap">{renderNotificationBadge(row, gf)}</span>
            {formDocNo !== '-' && <CopyButton text={formDocNo} size="small" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
          <span className={`text-sm font-medium ${isOtherIncomeSell ? 'text-blue-400' : 'text-red-500'}`}>
                            {sellStatus}
                          </span>
                        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{branchName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
          {gf.originators?.name || gf.request_user_name || gf.user_id || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center justify-end gap-2">
                            {exceedsThreshold ? (
                              <ArrowUpIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(totalAmount).toLocaleString('en-US')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
          {formatDateDDMMYY(gf.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
          {formatDateTimeDDMMYY(gf.updated_at)}
                        </td>
                      </tr>
                    );
  };

  const renderMobileCard = (row, idx) => {
    const gf = row.general_form || row || {};
            const detailId = row.id;
    const displayNo = (safeCurrentPage - 1) * PAGE_SIZE + idx + 1;
    
            const toBranchInfo = normalizeBranch(gf.to_branch || gf.toBranch);
            const fromBranchInfo = normalizeBranch(gf.from_branch || gf.fromBranch);
            const branchInfo = toBranchInfo.id != null || toBranchInfo.name ? toBranchInfo : fromBranchInfo;
            const branchName = resolveBranchName(gf, branchInfo);
    
    const formDocNo = gf.form_doc_no || row.form_doc_no || gf.general_form?.form_doc_no || gf.document_number || gf.doc_no || row.document_number || row.doc_no || '-';
    
            const assetType = gf.asset_type || gf.case_type || gf.caseType;
    const isOtherIncomeSell = assetType === 'on' || assetType === 'Other income sell';
            const sellStatus = isOtherIncomeSell 
              ? t('list.otherIncomeSell', { defaultValue: 'Other Income Sell' }) 
              : t('list.notSell', { defaultValue: 'Not Sell' });
    
    const totalAmount = getTotalAmount(row, gf, formTotals);
    const exceedsThreshold = totalAmount > OP_THRESHOLD;

            return (
              <div
                key={`mobile-card-${row.id}`}
                role="button"
                tabIndex={0}
                onClick={() => navigateToDetail(detailId, row.id, gf.id || null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToDetail(detailId, row.id, gf.id || null);
                  }
                }}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900 truncate">
                  {formDocNo}
                        </p>
                {formDocNo !== '-' && <CopyButton text={formDocNo} size="small" />}
                        <span className="whitespace-nowrap">{renderNotificationBadge(row, gf)}</span>
                      </div>
                    </div>
                  </div>
                    <StatusBadge status={gf.status || '-'} />
                </div>

                <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('list.columns.sellStatus', { defaultValue: 'Sell Status' })}
          </span>
          <span className={`text-sm font-medium ${isOtherIncomeSell ? 'text-blue-400' : 'text-red-500'}`}>
                    {sellStatus}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('list.columns.branch', { defaultValue: 'Branch' })}
                    </span>
            <span className="text-sm font-medium text-gray-900">{branchName}</span>
                  </div>
                  <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('list.columns.requestedBy', { defaultValue: 'Requested By' })}
            </span>
                    <span className="text-sm text-gray-700">
              {gf.originators?.name || gf.request_user_name || gf.user_id || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('list.columns.amount', { defaultValue: 'Amount' })}
            </span>
                    <div className="flex items-center gap-1">
                      {exceedsThreshold ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-600" />
                      )}
              <span className="text-sm font-medium text-gray-900">
                        {Math.round(totalAmount).toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('list.columns.created', { defaultValue: 'Created' })}
                    </span>
            <span className="text-sm text-gray-700">{formatDateDDMMYY(gf.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('list.columns.modified', { defaultValue: 'Modified' })}
                    </span>
            <span className="text-sm text-gray-700">{formatDateTimeDDMMYY(gf.updated_at)}</span>
                  </div>
                </div>
              </div>
            );
  };

  return (
    <div className="mx-auto font-sans px-6">
      <div className="hidden md:block bg-white rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-t-xl border border-gray-200">
            {loading ? (
              <div className="p-4">
                <Skeleton count={5} height={50} className="mb-2" />
              </div>
            ) : isEmpty ? (
              <EmptyState />
            ) : (
              <table className="min-w-full">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          index === 0 ? 'w-12' :
                          index === 1 ? 'w-28' :
                          index === 2 ? 'w-80 text-left' :
                          index === 3 ? 'w-36 text-left' :
                          index === 4 ? 'w-28 text-left' :
                          index === 5 ? 'w-36 text-left' :
                          index === 6 ? 'w-32 text-right pr-6' :
                          index === 7 ? 'w-44 text-left' :
                          index === 8 ? 'w-48 text-left' :
                          'text-left'
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {pagedVisibleIssues.map((row, idx) => renderRow(row, idx))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <div key={`mobile-skeleton-${index}`} className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <Skeleton width={80} height={16} />
                <Skeleton width={90} height={24} borderRadius={999} />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton height={14} />
                <Skeleton height={14} />
                <Skeleton height={14} />
              </div>
            </div>
          ))
        ) : isEmpty ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <EmptyState />
          </div>
        ) : (
          pagedVisibleIssues.map((row, idx) => renderMobileCard(row, idx))
        )}
      </div>

      <div className="mt-4 md:mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:border-t md:pt-4 border-gray-100">
        <div className="flex justify-center md:justify-start w-full md:w-auto">
          <Pagination
            totalRows={effectiveTotalRows}
            rowsPerPage={PAGE_SIZE}
            currentPage={safeCurrentPage}
            onPageChange={onPageChange}
          />
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-600">
          {t('list.totalRows', { defaultValue: 'Total' })}{' '}
          <span className="text-red-600 font-semibold">{effectiveTotalRows}</span>{' '}
          {t('list.rows', { defaultValue: 'Rows' })}
        </span>
      </div>
    </div>
  );
}

export default DamageIssueList;
