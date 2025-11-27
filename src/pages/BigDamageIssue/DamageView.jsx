// pages/BigDamageIssue/DamageView.jsx
import React, { useMemo, useEffect, useContext, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import DamageFormLayout from "../../components/DamageForm/DamageFormLayout";
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useSWR from 'swr';
import { NotificationContext } from '../../context/NotificationContext';

const normalizeImageKeyValue = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^(?:data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    const base = typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : undefined;
    const parsed = new URL(trimmed, base);
    if (!parsed || !parsed.pathname) {
      return trimmed;
    }
    const pathname = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
    const search = parsed.search && !/^(?:\?v=|\?t=)/i.test(parsed.search) ? parsed.search : '';
    return `${pathname}${search}`;
  } catch (_) {
    return trimmed;
  }
};

const ensureAbsoluteImageUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^(?:https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }

  return trimmed;
};

const resolveImageInfo = (rawFile) => {
  if (!rawFile || typeof rawFile !== 'string') {
    return null;
  }

  const trimmed = rawFile.trim();
  if (!trimmed) {
    return null;
  }

  if (/^(?:https?:|data:|blob:)/i.test(trimmed)) {
    return {
      key: trimmed,
      path: undefined,
      url: trimmed,
    };
  }

  const relative = trimmed.startsWith('/api/public-files/')
    ? trimmed
    : `/api/public-files/${encodeURIComponent(trimmed).replace(/%2F/g, '/')}`;

  return {
    key: relative,
    path: relative,
    url: ensureAbsoluteImageUrl(relative),
  };
};

const normalizeProductCode = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized = String(value).trim();
  return normalized ? normalized.toUpperCase() : '';
};

const resolveImageKey = (entry) => {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    return normalizeImageKeyValue(entry) || entry;
  }

  if (entry.value) {
    const nested = resolveImageKey(entry.value);
    if (nested) {
      return nested;
    }
  }

  const candidates = [entry.path, entry.url, entry.src, entry.previewUrl, entry.file];
  for (const candidate of candidates) {
    const normalized = normalizeImageKeyValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  if (typeof entry.file === 'string' && entry.file.trim() !== '') {
    const info = resolveImageInfo(entry.file);
    if (info?.key) {
      return normalizeImageKeyValue(info.key) || info.key;
    }
  }

  return null;
};

const normalizeImageEntry = (entry) => {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    const info = resolveImageInfo(entry);
    if (!info?.url) {
      return null;
    }

    return {
      type: 'url',
      file: entry,
      name: undefined,
      path: info.path,
      url: info.url,
      src: info.url,
      previewUrl: info.url,
    };
  }

  if (entry instanceof File || entry instanceof Blob) {
    const blobUrl = URL.createObjectURL(entry);
    return {
      type: 'upload',
      fileObject: entry,
      url: blobUrl,
      src: blobUrl,
      previewUrl: blobUrl,
    };
  }

  if (typeof entry === 'object') {
    const clone = { ...entry };
    const info = resolveImageInfo(
      typeof clone.path === 'string' && clone.path.trim() !== ''
        ? clone.path
        : typeof clone.url === 'string' && clone.url.trim() !== ''
          ? clone.url
          : typeof clone.src === 'string' && clone.src.trim() !== ''
            ? clone.src
            : typeof clone.previewUrl === 'string'
              ? clone.previewUrl
              : typeof clone.file === 'string'
                ? clone.file
                : null
    );

    if (info?.url) {
      clone.path = info.path ?? clone.path;
      clone.url = info.url;
      clone.src = info.url;
      clone.previewUrl = info.url;
    }

    return clone;
  }

  return null;
};

const dedupeAndLimitImages = (entries, limit = 3) => {
  if (!Array.isArray(entries) || !entries.length) {
    return [];
  }

  const seen = new Set();
  const output = [];

  for (const rawEntry of entries) {
    if (output.length >= limit) {
      break;
    }

    const normalized = normalizeImageEntry(rawEntry);
    if (!normalized) {
      continue;
    }

    const key = resolveImageKey(normalized);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(normalized);
  }

  return output;
};


const toImageUrlList = (entries) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  const urls = [];
  const seen = new Set();

  for (const entry of entries) {
    let candidate = null;

    if (typeof entry === 'string') {
      const canonicalKey = normalizeImageKeyValue(entry);
      candidate = canonicalKey ? ensureAbsoluteImageUrl(canonicalKey) : ensureAbsoluteImageUrl(entry);
    } else if (entry) {
      const canonicalKey = normalizeImageKeyValue(
        entry.path || entry.url || entry.src || entry.previewUrl || entry.file || null
      );
      candidate = canonicalKey ? ensureAbsoluteImageUrl(canonicalKey) : ensureAbsoluteImageUrl(
        entry.url || entry.src || entry.previewUrl || entry.path || entry.file || ''
      );
      if (candidate && typeof candidate === 'string') {
        candidate = ensureAbsoluteImageUrl(candidate);
      } else {
        candidate = null;
      }
    }

    if (!candidate || seen.has(candidate)) {
      continue;
    }

    seen.add(candidate);
    urls.push(candidate);

    if (urls.length >= 3) {
      break;
    }
  }

  return urls.slice(0, 3);
};

const collectExistingImages = (item) => {
  const sources = [
    item?.img,
    item?.images,
    item?.damage_images,
    item?.damageImages,
    item?.photos,
    item?.attachments,
  ];

  const seen = new Set();
  const list = [];

  const processEntry = (entry) => {
    if (!entry) {
      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach(processEntry);
      return;
    }

    const key = resolveImageKey(entry);
    if (key && !seen.has(key)) {
      seen.add(key);
      list.push(entry);
    }
  };

  sources.forEach(processEntry);

  return { list, seen };
};

const attachImagesToItems = (items = [], files = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return Array.isArray(items) ? items : [];
  }

  if (!Array.isArray(files) || files.length === 0) {
    return items.map((item) => ({ ...item }));
  }

  const grouped = files.reduce((acc, file) => {
    const code = normalizeProductCode(file?.product_code ?? file?.productCode ?? file?.code);
    if (!code) {
      return acc;
    }

    const info = resolveImageInfo(
      typeof file?.path === 'string' && file.path.trim() !== ''
        ? file.path
        : typeof file?.url === 'string' && file.url.trim() !== ''
          ? file.url
          : typeof file?.file === 'string'
            ? file.file
            : ''
    );

    if (!info?.key) {
      return acc;
    }

    if (!acc.has(code)) {
      acc.set(code, new Map());
    }

    const payload = {
      type: 'url',
      file: typeof file?.file === 'string' ? file.file : undefined,
      name: typeof file?.name === 'string' ? file.name : undefined,
      path: info.path,
      url: info.url,
      src: info.url,
      previewUrl: info.url,
    };

    acc.get(code).set(info.key, payload);
    return acc;
  }, new Map());

  if (!grouped.size) {
    return items.map((item) => ({ ...item }));
  }

  const result = items.map((item) => {
    const code = normalizeProductCode(item?.product_code ?? item?.productCode ?? item?.code);
    
    if (!code || !grouped.has(code)) {
      const { list } = collectExistingImages(item);
      const limited = list.slice(0, 3);
      const normalized = dedupeAndLimitImages(limited, 3);
      const urls = toImageUrlList(normalized);

      
      if (
        urls.length === (item?.images?.length || 0) &&
        urls.length === (item?.img?.length || 0)
      ) {
        return item;
      }

      return {
        ...item,
        img: urls,
        images: urls,
        damage_images: urls,
      };
    }

    const images = grouped.get(code);
    const imgList = Array.from(images.values());
    
    return {
      ...item,
      img: imgList,
      images: imgList,
      damage_images: imgList,
    };
  });
  
  return result;
};

export default function DamageView() {
  const { id } = useParams();
  const location = useLocation();
  const { setNotifications } = useContext(NotificationContext);
  const hasMarkedNotificationRef = useRef(false);
  const token = useMemo(() => localStorage.getItem("token"), []);
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (error) {
      /* ignore malformed user payload */
    }
    return null;
  }, []);

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const fetchJsonWithBackoff = async (url, options = {}) => {
    const { retry = 1, ...fetchOptions } = options;
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    
    const mergedOptions = {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...(fetchOptions.headers || {})
      }
    };
    
    const res = await fetch(url, mergedOptions);
    if (res.status === 429 && retry > 0) {
      const ra = parseInt(res.headers.get('Retry-After') || '0', 10);
      const waitMs = (isFinite(ra) && ra > 0 ? ra * 1000 : 1000);
      await new Promise(r => setTimeout(r, waitMs));
      return fetchJsonWithBackoff(url, { ...options, retry: retry - 1 });
    }
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`HTTP ${res.status} ${text || ''}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  };

  const { data: viewData, error, isLoading, mutate } = useSWR(
    token && id ? ['damage-view', id, location?.state?.generalFormId || null] : null,
    async ([, idKey, generalFormId]) => {
      if (!token) throw new Error('NO_TOKEN');

      // Primary detail
      let payload;
      try {
        const json = await fetchJsonWithBackoff(`/api/big-damage-issues/${idKey}`);
        payload = json && typeof json === 'object' && !Array.isArray(json)
          ? (json.data && typeof json.data === 'object' ? json.data : json)
          : {};
      } catch (e) {
        // Primary not found: fallback by generalFormId if provided
        if (e.status === 404 && generalFormId) {
          const altJson = await fetchJsonWithBackoff(`/api/general-forms/${generalFormId}/big-damage-issues`);
          const list = Array.isArray(altJson?.data) ? altJson.data : (Array.isArray(altJson) ? altJson : []);
          if (!list.length) throw new Error('HTTP 404 Not Found');
          const record = list[0];
          // Items from list
          let items = list.map(r => {
            const price = Number(r.price ?? 0);
            const qty = Number(r.product_type ?? r.actual_qty ?? r.final_qty ?? 0);
            // Always recalculate amount to ensure accuracy
            const amount = Number((price * qty).toFixed(2));

            const rawImages = Array.isArray(r.img) && r.img.length
              ? r.img
              : (Array.isArray(r.images) ? r.images : []);

            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
            }
            
            return {
              id: r.id,
              category: (r.categories && r.categories.name) || '',
              category_id: r.product_category_id || null,
              code: r.product_code || '',
              name: r.product_name || '',
              unit: r.unit || '',
              system_qty: r.system_qty ?? 0,
              request_qty: r.request_qty ?? 0,
              final_qty: r.final_qty ?? 0,
              actual_qty: qty,
              price: price,
              amount: amount,
              remark: r.remark || '',
              acc_code: r.acc_code ?? null,
              acc_code1: r.acc_code1 ?? r.acc_code ?? null,
              img: rawImages,
              images: rawImages,
            };
          });
          try {
            const allJson = await fetchJsonWithBackoff(`/api/general-forms/${generalFormId}/big-damage-images`);
            const files = Array.isArray(allJson?.data) ? allJson.data : [];
            items = attachImagesToItems(items, files);
          } catch (_) {}
          return { record, items, approvals: [], actions: {}, attachments: [] };
        }
        throw e;
      }

      const gfId = payload?.general_form?.id;
      if (!gfId) {
        return { record: payload, items: [], approvals: [], actions: {}, attachments: [] };
      }
      // Reduce parallel bursts: fetch sequentially with 429 backoff
      let items = [];
      try {
        const listJson = await fetchJsonWithBackoff(`/api/general-forms/${gfId}/big-damage-issues?per_page=1000`);
        const rows = Array.isArray(listJson?.data) ? listJson.data : (Array.isArray(listJson) ? listJson : []);
        items = rows.map(r => {
          const price = Number(r.price ?? 0);
          const qty = Number(r.product_type ?? r.actual_qty ?? r.final_qty ?? 0);
          // Always recalculate amount to ensure accuracy
          const amount = Number((price * qty).toFixed(2));

          const rawImages = Array.isArray(r.img) && r.img.length
            ? r.img
            : (Array.isArray(r.images) ? r.images : []);
          const uniqueImages = Array.from(new Set(rawImages.filter((value) => typeof value === 'string' && value.trim().length)))
            .slice(0, 3);
          const fallbackPath = Array.isArray(r.images)
            ? r.images.find((entry) => entry && entry.path)
            : null;

          return {
            id: r.id,
            category: (r.categories && r.categories.name) || '',
            category_id: r.product_category_id || null,
            code: r.product_code || '',
            name: r.product_name || '',
            unit: r.unit || '',
            system_qty: r.system_qty ?? 0,
            request_qty: r.request_qty ?? 0,
            final_qty: r.final_qty ?? 0,
            actual_qty: qty,
            price: price,
            amount: amount,
            remark: r.remark || '',
            acc_code: r.acc_code ?? null,
            acc_code1: r.acc_code1 ?? r.acc_code ?? null,
            img: uniqueImages,
            images: uniqueImages,
            damage_images: fallbackPath ? [fallbackPath.path] : uniqueImages,
          };
        });
      } catch (_) {}

      try {
        const allJson = await fetchJsonWithBackoff(`/api/general-forms/${gfId}/big-damage-images`);
        const files = Array.isArray(allJson?.data) ? allJson.data : [];
        items = attachImagesToItems(items, files);
      } catch (error) {
        // Silently handle error
      }

      let operationFiles = [];
      try {
        const operationFilesResponse = await fetchJsonWithBackoff('/api/big-damage-issues/get-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'all', // 'all' for operation/owner uploads, 'ch' for checker uploads
            id: gfId
          })
        });

        const operationFilesData = operationFilesResponse?.img || [];
        operationFiles = Array.isArray(operationFilesData) ? operationFilesData.map(file => {
          // Files are copied to public storage by get_Image method, so use just the filename
          // The get_Image method copies from FTP 'big_damage_doc/' to public storage
          return {
            id: file.id || `doc_${file.file}`,
            name: file.name || file.file,
            file: file.file,
            downloadUrl: `/api/public-files/${encodeURIComponent(file.file)}`,
            previewUrl: `/api/public-files/${encodeURIComponent(file.file)}`,
            size: null,
            acc_type: file.acc_type || null,
          };
        }) : [];
      } catch (error) {
        // Silently handle error
      }

      let approvals = [];
      try {
        const apprJson = await fetchJsonWithBackoff(`/api/general-forms/${gfId}/approvals`);
        const rowsAppr = Array.isArray(apprJson?.data) ? apprJson.data : [];
        const availableRows = [...rowsAppr];
        const consumeBy = (...predicates) => {
          for (const predicate of predicates) {
            const index = availableRows.findIndex((row) => {
              try {
                return predicate(row);
              } catch (error) {
                return false;
              }
            });
            if (index !== -1) {
              return availableRows.splice(index, 1)[0];
            }
          }
          return null;
        };

        const normalizeText = (value) => (value ?? '').toString().trim();
        const preparedName = payload?.general_form?.originators?.name
          || payload?.general_form?.created_by_name
          || payload?.general_form?.originator_name
          || payload?.general_form?.requester_name
          || payload?.general_form?.user?.name
          || '';
        const preparedDate = payload?.general_form?.created_at || payload?.general_form?.datetime || '';
        
        const checkerEntry = consumeBy(
          (row) => ['C', 'CS'].includes(normalizeText(row?.user_type)),
          (row) => normalizeText(row?.status) === 'Checked'
        );
        const approverEntry = consumeBy(
          (row) => normalizeText(row?.user_type) === 'A1',
          (row) => ['BM Approved', 'Approved'].includes(normalizeText(row?.status))
        );
        const opManagerEntry = consumeBy(
          (row) => normalizeText(row?.user_type) === 'A2',
          (row) => normalizeText(row?.status) === 'OPApproved'
        );
        const acknowledgedEntry = consumeBy(
          (row) => normalizeText(row?.user_type) === 'AC',
          (row) => ['Ac_Acknowledged', 'Acknowledged'].includes(normalizeText(row?.status))
        );
        const issuedEntry = consumeBy(
          (row) => normalizeText(row?.user_type) === 'ACK' && ['Issued', 'Completed', 'SupervisorIssued'].includes(normalizeText(row?.status)),
          (row) => normalizeText(row?.user_type) === 'ACK',
          (row) => normalizeText(row?.user_type) === 'R' && ['Issued', 'Completed'].includes(normalizeText(row?.status))
        );
        const totalAmount = payload?.general_form?.total_amount || 0;

        const resolveName = (entry) => {
          // Prioritize actual_user_name as it's the most accurate
          if (entry?.actual_user_name) return entry.actual_user_name;
          if (entry?.name) return entry.name;
          if (entry?.assigned_name) return entry.assigned_name;
          if (entry?.approver_name) return entry.approver_name;
          // Check raw data
          if (entry?.raw?.actual_user_name) return entry.raw.actual_user_name;
          if (entry?.raw?.name) return entry.raw.name;
          return '';
        };
        const resolveDate = (entry) => entry?.acted_at || entry?.updated_at || entry?.date || entry?.created_at || '';
        const resolveStatus = (entry, fallback) => {
          if (!entry) return 'Pending';
          const normalizedStatus = normalizeText(entry.status);
          const normalizedFallback = normalizeText(fallback);

          if (entry.acted) {
            return entry.status || fallback;
          }

          if (normalizedStatus) {
            if (normalizedStatus === normalizedFallback) {
              return entry.status || fallback;
            }

            if (['completed', 'issued', 'supervisorissued'].includes(normalizedStatus)) {
              return entry.status || (normalizedStatus === 'completed'
                ? 'Completed'
                : normalizedStatus === 'supervisorissued'
                  ? 'SupervisorIssued'
                  : 'Issued');
            }
          }

          return 'Pending';
        };

        const addStage = (label, entry, fallbackStatus, role, defaultUserType) => {
          const statusValue = entry ? resolveStatus(entry, fallbackStatus) : 'Pending';
          const normalizedStatusValue = normalizeText(statusValue);
          const actedValue = entry ? (
            Boolean(entry?.acted)
            || normalizedStatusValue === normalizeText(fallbackStatus)
            || (label === 'Issued by' && ['completed', 'issued', 'supervisorissued'].includes(normalizedStatusValue))
            || (label === 'Acknowledged by' && ['ac_acknowledged', 'acknowledged'].includes(normalizedStatusValue))
          ) : (
            // If no entry but status indicates it should be acted
            (label === 'Acknowledged by' && (normalizeText(payload?.general_form?.status) === 'ac_acknowledged' || normalizeText(payload?.general_form?.status) === 'acknowledged')) ||
            (label === 'Issued by' && (normalizeText(payload?.general_form?.status) === 'completed' || normalizeText(payload?.general_form?.status) === 'issued' || normalizeText(payload?.general_form?.status) === 'supervisorissued'))
          );
          const rawDate = entry ? resolveDate(entry) : '';
          const rawName = entry ? resolveName(entry) : '';
          const commentValue = entry?.comment || '';
          const userTypeValue = entry?.user_type || defaultUserType;
            const fallbackNames = [
            rawName,
            entry?.user?.name,
            entry?.approval_users?.name,
            entry?.actual_user?.name,
            (label === 'Checked by' && normalizeText(entry?.user_type) === 'A1' && normalizeText(entry?.status) === 'Checked') ? (entry?.name || entry?.assigned_name) : null,
            entry?.assigned_name,
            label === 'Prepared by' ? entry?.created_by_name : null,
            label === 'Prepared by' ? entry?.originator_name : null,
            label === 'Prepared by' ? entry?.requester_name : null,
            label === 'Checked by' ? payload?.general_form?.checked_by_name : null,
            label === 'Checked by' ? payload?.general_form?.checked_by_user?.name : null,
            (!entry && label === 'Checked by') ? currentUser?.name : null,
            label === 'Acknowledged by' ? payload?.general_form?.acknowledged_by_name : null,
            label === 'Acknowledged by' ? payload?.general_form?.acknowledged_by_user?.name : null,
            // For "Issued by", prioritize actual_user_name from entry (most accurate)
            label === 'Issued by' ? entry?.actual_user_name : null,
            label === 'Issued by' ? entry?.raw?.actual_user_name : null,
            label === 'Issued by' ? entry?.name : null,
            label === 'Issued by' ? entry?.raw?.name : null,
            label === 'Issued by' ? payload?.general_form?.issued_by_name : null,
            label === 'Issued by' ? payload?.general_form?.issued_by_user?.name : null,
          ].filter((val) => val && val.toString().trim().length > 0);
          const fallbackDates = [
            rawDate,
            entry?.date,
            entry?.acted_at,
            entry?.updated_at,
            label === 'Prepared by' ? entry?.created_at : null,
            label === 'Checked by' ? payload?.general_form?.checked_at : null,
            label === 'Checked by' ? payload?.general_form?.checked_datetime : null,
            label === 'Acknowledged by' ? payload?.general_form?.acknowledged_at : null,
            label === 'Acknowledged by' ? entry?.created_at : null,
            label === 'Issued by' ? payload?.general_form?.issued_at : null,
          ].filter(Boolean);
          const nameValue = fallbackNames.length ? fallbackNames[0] : (
            label === 'Checked by' && actedValue
              ? (payload?.general_form?.checked_by_name || payload?.general_form?.checked_by_user?.name || '')
              : ''
          );
          const dateValue = fallbackDates.length ? fallbackDates[0] : (
            label === 'Checked by' && actedValue
              ? (payload?.general_form?.checked_at || payload?.general_form?.checked_datetime || payload?.general_form?.updated_at || '')
              : ''
          );
          const branchValue = entry?.actual_user_branch || entry?.user?.from_branches?.branch_short_name || '';

          approvals.push({
            label,
            user_type: userTypeValue,
            name: nameValue,
            date: dateValue,
            status: statusValue,
            comment: commentValue,
            acted: actedValue,
            role,
            branch: branchValue,
            raw: entry,
          });
        };

        addStage('Checked by', checkerEntry, 'Checked', 'Branch LP', 'C');
        addStage('BM Approved by', approverEntry, 'Approved', 'BM/ABM', 'A1');

        if (totalAmount > 500000) {
          addStage('Operation Mgr Approved by', opManagerEntry, 'Approved', 'Operation Manager', 'A2');
        }

        // Add Acknowledged by stage if status is Ac_Acknowledged or if AC approval exists
        const currentStatus = payload?.general_form?.status || '';
        if (acknowledgedEntry || currentStatus === 'Ac_Acknowledged' || currentStatus === 'Acknowledged') {
          addStage('Acknowledged by', acknowledgedEntry, 'Ac_Acknowledged', 'Branch Account', 'AC');
        }

        // Add Issued by stage - always show it, especially when status is Completed/Issued
        // This ensures it appears even if the ACK approval entry is not found
        if (issuedEntry || currentStatus === 'Completed' || currentStatus === 'Issued' || currentStatus === 'SupervisorIssued') {
          addStage('Issued by', issuedEntry, 'Completed', 'Supervisor', 'ACK');
        }
      } catch (_) {}

      let actions = {};
      try {
        actions = await fetchJsonWithBackoff(`/api/general-forms/${gfId}/actions`);
      } catch (_) {}

      return { record: payload, items, approvals, actions, attachments: operationFiles };
    },
    { 
      revalidateOnFocus: false, 
      revalidateOnReconnect: false, 
      revalidateOnMount: true,
      dedupingInterval: 1000 
    }
  );

  const record = viewData?.record || {};
  const items = viewData?.items || [];
  const approvals = viewData?.approvals || [];
  const actions = viewData?.actions || {};
  const operationFiles = viewData?.attachments || [];
  const gf = record?.general_form || {};

  // Mark notifications as read when viewing this form
  // IMPORTANT: This hook must be called before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    const markNotificationAsRead = async () => {
      if (!viewData?.record || !token || hasMarkedNotificationRef.current) return;
      
      // Get generalFormId from viewData directly to avoid dependency issues
      const generalFormId = viewData?.record?.general_form?.id 
        || viewData?.record?.general_form_id 
        || location?.state?.generalFormId;
      if (!generalFormId) return;

      // Mark that we've attempted to mark notifications to prevent duplicate calls
      hasMarkedNotificationRef.current = true;

      try {
        // Mark form as viewed
        const viewResponse = await fetch('/api/forms/mark-as-viewed', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            general_form_id: generalFormId
          })
        });

        // Mark notifications as read
        const response = await fetch('/api/notifications/mark-as-read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            form_id: 8, // Big Damage Issue form_id
            general_form_id: generalFormId,
            specific_form_id: generalFormId
          })
        });

        if (response.ok && viewResponse.ok) {
          // Set flag to trigger list refresh when user returns to dashboard
          sessionStorage.setItem('bigDamageFormViewed', 'true');
          
          const result = await response.json();
          // Refresh notifications by fetching them again
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user?.id) {
            const notiResponse = await fetch(`/api/notifications/${user.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
              credentials: 'include'
            });
            
            if (notiResponse.ok) {
              const notiData = await notiResponse.json();
              if (Array.isArray(notiData)) {
                const parsed = notiData.map(n => ({
                  form_id: n.data?.form_id,
                  specific_form_id: n.data?.specific_form_id,
                  form_doc_no: n.data?.form_doc_no,
                  created_at: n.created_at,
                  form_name: n.form_name || 'Unknown Form',
                  status: n.status || 'pending',
                }));
                setNotifications(parsed);
                localStorage.setItem("notifications", JSON.stringify(parsed));
              }
            }
          }
        }
      } catch (error) {
        // Silently handle errors - don't break the UI if notification marking fails
      }
    };

    // Only mark as read if we have the form data loaded and haven't marked it yet
    if (viewData?.record && !isLoading && !hasMarkedNotificationRef.current) {
      markNotificationAsRead();
    }
  }, [viewData?.record, token, isLoading, setNotifications, location?.state?.generalFormId]);
  
  // Reset the ref when the form ID changes (user navigates to a different form)
  useEffect(() => {
    hasMarkedNotificationRef.current = false;
  }, [id]);

  // Now safe to have conditional returns after all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
            <div className="mb-4">
              <Skeleton width={260} height={28} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Skeleton height={84} />
              <Skeleton height={84} />
              <Skeleton height={84} />
            </div>

            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <div className="mb-3">
                <Skeleton width={180} height={22} />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={`item-skel-${i}`} className="grid grid-cols-6 gap-3 py-2 border-b border-gray-200 last:border-0">
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                  <Skeleton height={18} />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="mb-3">
                <Skeleton width={180} height={22} />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={`appr-skel-${i}`} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <Skeleton width={140} height={18} />
                  <div className="flex items-center gap-4">
                    <Skeleton width={160} height={18} />
                    <Skeleton width={120} height={18} />
                    <Skeleton width={90} height={18} />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonTheme>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-10 flex items-center justify-center">
        <div className="text-red-600 font-semibold">
          {error?.message || String(error) || 'An error occurred while loading the form'}
        </div>
      </div>
    );
  }

  const docNumber = gf.form_doc_no
    || gf.formDocNo
    || gf.form_doc
    || gf.doc_no
    || gf.document_no
    || '';
  const rawIssFiles = gf.files
    || gf.general_form_files
    || record?.general_form_files
    || record?.files
    || [];
  const issNumbers = Array.isArray(rawIssFiles)
    ? rawIssFiles
        .map((entry) => {
          if (!entry) return null;
          if (typeof entry === 'string') return entry.trim();

          if (typeof entry === 'object') {
            const candidates = [entry.name, entry.file, entry.document_no, entry.doc_no];
            const match = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
            return match ? match.trim() : null;
          }

          return null;
        })
        .filter(Boolean)
    : [];
  const accountOptions = Array.isArray(gf.account_codes)
    ? gf.account_codes
    : (Array.isArray(record?.account_codes) ? record.account_codes : []);

  const remarkOptions = Array.isArray(gf.issue_remarks)
    ? gf.issue_remarks
    : (Array.isArray(record?.issue_remarks) ? record.issue_remarks : []);

  const initialData = {
    id: gf.id, // Add id field for DamageFormLayout
    branch: gf.from_branch_name || gf.to_branch_name || "",
    caseType: gf.case_type || gf.asset_type || "",
    datetime: gf.created_at || new Date().toISOString().slice(0, 16),
    requester_name: gf.requester_name || gf.originator_name || gf.created_by_name || gf.originators?.name || '',
    originator_name: gf.originators?.name || gf.originator_name || '',
    created_by_name: gf.created_by_name || gf.originators?.name || '',
    user_name: gf.user?.name || '',
    user_id: gf.user_id || gf.created_by || null,
    created_by: gf.created_by || null,
    general_form: gf,
    items,
    reason: gf.remark || "",
    g_remark: gf.g_remark || "",
    status: gf.status || "",
    approvals,
    actions,
    generalFormId: gf.id,
    form_doc_no: docNumber,
    iss_numbers: issNumbers,
    issNumbers,
    files: Array.isArray(gf.files)
      ? gf.files
      : Array.isArray(record?.general_form_files)
        ? record.general_form_files
        : Array.isArray(record?.files)
          ? record.files
          : rawIssFiles,
    general_form_files: Array.isArray(gf.general_form_files)
      ? gf.general_form_files
      : Array.isArray(record?.general_form_files)
        ? record.general_form_files
        : rawIssFiles,
    attachments: operationFiles, // Operation uploaded files (document_uploads)
    account_codes: accountOptions,
    issue_remarks: remarkOptions,
    acc_status: gf.acc_status ?? null,
    acc_code: gf.acc_code ?? null,
    // Extract ISS remark from general_form_files (file field contains remark name, reason field can also contain it)
    iss_remark: gf.iss_remark ?? 
      (Array.isArray(gf.files) && gf.files.length > 0
        ? (gf.files.find(f => f.file && f.file !== 'ISS_DOCUMENT')?.file || gf.files.find(f => f.reason)?.reason)
        : null) ??
      (Array.isArray(gf.general_form_files) && gf.general_form_files.length > 0
        ? (gf.general_form_files.find(f => f.file && f.file !== 'ISS_DOCUMENT')?.file || gf.general_form_files.find(f => f.reason)?.reason)
        : null) ??
      null,
  };

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DamageFormLayout
        mode="view"
        initialData={initialData}
        onActionComplete={() => mutate()}
      />
    </div>
  );
}
