export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

export const extractImageArray = (item = {}) => {
  if (!item || typeof item !== 'object') return [];

  const candidates = [
    item.img, item.images, item.damage_images, item.damageImages,
    item.photos, item.attachments, item.image, item.media, item.originalItem,
    item.originalItem?.img, item.originalItem?.images, item.originalItem?.damage_images,
    item.originalItem?.photos, item.originalItem?.attachments,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) return candidate;
  }
  return [];
};

export const resolvePublicUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  const trimmed = value.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  return `/api/public-files/${trimmed.replace(/^\/+/, '')}`;
};

export const resolveInitialAttachments = (source = {}, fallback = []) => {
  const safeSource = source && typeof source === 'object' ? source : {};

  const coerceArray = (candidate) => {
    if (!candidate) return [];
    if (Array.isArray(candidate)) return candidate;
    if (candidate?.data && Array.isArray(candidate.data)) return candidate.data;
    return [];
  };

  const generalForm = safeSource.general_form || safeSource.generalForm || null;
  const meta = safeSource.meta || {};

  const possibleLists = [
    coerceArray(safeSource.attachments),
    coerceArray(safeSource.operation_files || safeSource.operationFiles),
    coerceArray(safeSource.files),
    coerceArray(safeSource.document_uploads || safeSource.documentUploads),
    coerceArray(safeSource.supporting_files || safeSource.supportingFiles),
    coerceArray(generalForm?.attachments),
    coerceArray(generalForm?.files),
    coerceArray(generalForm?.document_uploads || generalForm?.documentUploads),
    coerceArray(generalForm?.operation_files || generalForm?.operationFiles),
    coerceArray(safeSource.general_form_files || safeSource.generalFormFiles),
    coerceArray(meta?.attachments),
  ];

  const combined = possibleLists.flat().filter(Boolean);
  if (!combined.length) return Array.isArray(fallback) ? [...fallback] : [];

  const seen = new Set();
  const normalized = [];

  combined.forEach((attachment) => {
    if (!attachment) return;

    const entry = typeof attachment === 'object' ? { ...attachment } : { name: String(attachment) };
    if (!entry || typeof entry !== 'object') return;

    const fallbackName = entry.name || entry.original_name || entry.originalName || 
                         entry.file_name || entry.fileName || entry.file || 
                         entry.path || entry.downloadUrl || entry.url || '';

    const id = entry.id || entry.uuid || entry.key || entry.document_id || 
               `${fallbackName}-${entry.size || ''}`;

    if (seen.has(id)) return;
    seen.add(id);

    entry.id = id;

    if (!entry.previewUrl) {
      entry.previewUrl = resolvePublicUrl(entry.url) || resolvePublicUrl(entry.downloadUrl) || 
                         resolvePublicUrl(entry.path) || resolvePublicUrl(entry.file) || entry.previewUrl;
    }

    if (!entry.downloadUrl) {
      entry.downloadUrl = resolvePublicUrl(entry.file) || resolvePublicUrl(entry.path) || 
                          resolvePublicUrl(entry.url) || entry.previewUrl || entry.downloadUrl;
    }

    if (!entry.name) {
      const derived = fallbackName ? fallbackName.split('/').pop() : '';
      entry.name = derived || `attachment-${normalized.length + 1}`;
    }

    normalized.push(entry);
  });

  return normalized.length ? normalized : (Array.isArray(fallback) ? [...fallback] : []);
};

export const resolveSubmitterName = (data) => {
  if (!data || typeof data !== 'object') return '';

  const generalForm = data.general_form || {};
  const candidates = [
    data.requester_name, data.originator_name, data.created_by_name,
    data.user_name, data.user?.name, data.requester?.name,
    data.meta?.requester_name, data.meta?.user?.name,
    generalForm.requester_name, generalForm.originator_name,
    generalForm.created_by_name, generalForm.request_user_name,
    generalForm.requester?.name, generalForm.user?.name, generalForm.originators?.name,
  ];

  const resolved = candidates.find((value) => typeof value === 'string' && value.trim());
  return resolved ? resolved.trim() : '';
};

export const convertAssetTypeToCaseType = (value) => {
  if (value === 'on') return 'Other income sell';
  if (value === 'off') return 'Not sell';
  if (value === 'Other income sell' || value === 'Not sell') return value;
  return 'Not sell';
};

export const ensurePreparedApproval = (approvalsList, fallbackName, metadata) => {
  if (!Array.isArray(approvalsList)) return approvalsList;

  const createdAt = metadata?.created_at || metadata?.general_form?.created_at || 
                    metadata?.general_form?.datetime || '';
  let preparedFound = false;

  const updated = approvalsList.map((approval) => {
    if (!approval) return approval;

    const label = (approval.label || approval.role || '').toLowerCase();
    if (!label.includes('prepared')) return approval;

    preparedFound = true;
    const nameCandidates = [
      approval.name, approval.actual_user_name, approval.actual_user_full_name,
      approval.user?.name, approval.raw?.name, fallbackName,
    ].filter((value) => typeof value === 'string' && value.trim());
    const name = nameCandidates.length ? nameCandidates[0].trim() : '';

    return {
      ...approval,
      name,
      actual_user_name: name || approval.actual_user_name,
      acted: approval.acted ?? Boolean(name),
      date: approval.date || createdAt || approval.acted_at || approval.updated_at || '',
    };
  });

  if (!preparedFound && fallbackName) {
    return [
      { label: 'Prepared by', name: fallbackName, acted: true, date: createdAt || new Date().toISOString() },
      ...updated,
    ];
  }

  return updated;
};

export const getTotalAmount = (formData, initialData) => {
  const itemsTotal = formData.items?.length > 0 
    ? formData.items.reduce((acc, i) => {
        const amount = Number(i.amount || i.total || i.total_amount || 0);
        return acc + (Number.isFinite(amount) ? amount : 0);
      }, 0)
    : 0;
  
  const dbTotal = Number(
    formData?.general_form?.total_amount ?? formData?.total_amount ??
    formData?.general_form?.totalAmount ?? formData?.totalAmount ??
    formData?.general_form?.total ?? formData?.total ??
    initialData?.general_form?.total_amount ?? initialData?.total_amount ??
    initialData?.general_form?.total ?? initialData?.total ?? 0
  );
  
  return dbTotal > 0 ? dbTotal : itemsTotal;
};

export const requiresOpManagerApproval = (totalAmount) => Number(totalAmount) > 500000;

