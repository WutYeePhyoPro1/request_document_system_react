import React from 'react';
import { useTranslation } from 'react-i18next';

const BUTTON_STYLES = {
  approve: 'bg-[#198754] border-[#198754] hover:bg-[#157347]',
  back: 'bg-[#ffc107] border-[#ffc107] hover:bg-[#e0a800] text-dark',
  cancel: 'bg-[#dc3545] border-[#dc3545] hover:bg-[#bb2d3b]',
  edit: 'bg-[#0d6efd] border-[#0d6efd] hover:bg-[#0b5ed7]',
  submit: 'bg-[#198754] border-[#198754] hover:bg-[#157347]',
};

const ActionButton = ({ action, label, onClick, disabled, isLoading, loadingText, className = '' }) => {
  const style = BUTTON_STYLES[action] || BUTTON_STYLES.approve;
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        px-4 py-2 text-white font-semibold rounded-lg border-2
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${style} ${className}
      `}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingText}
        </span>
      ) : label}
    </button>
  );
};

const ActionButtons = ({
  mode,
  status,
  userRole,
  isSubmitting,
  currentAction,
  canEdit,
  canCancel,
  canBackToPrevious,
  availableActions,
  onSubmit,
  onEdit,
  onCancel,
  onBackToPrevious,
  onApprove,
  getLoadingMessage,
}) => {
  const { t } = useTranslation();
  const statusLower = (status || '').toLowerCase();

  if (mode === 'create') {
    return (
      <div className="flex flex-wrap gap-3 justify-end mt-6">
        <ActionButton
          action="submit"
          label={t('buttons.submit', { defaultValue: 'Submit' })}
          onClick={() => onSubmit('Submit')}
          disabled={isSubmitting}
          isLoading={isSubmitting && currentAction === 'Submit'}
          loadingText={getLoadingMessage('submit')}
        />
      </div>
    );
  }

  const renderApproveButtons = () => {
    if (!availableActions || availableActions.length === 0) return null;

    return availableActions.map((action, idx) => {
      const actionKey = action.key || action.action || action;
      const actionLabel = action.label || action.name || actionKey;
      
      return (
        <ActionButton
          key={`${actionKey}-${idx}`}
          action="approve"
          label={actionLabel}
          onClick={() => onApprove(actionKey)}
          disabled={isSubmitting}
          isLoading={isSubmitting && currentAction === actionKey}
          loadingText={getLoadingMessage(actionKey)}
        />
      );
    });
  };

  return (
    <div className="flex flex-wrap gap-3 justify-end mt-6">
      {canEdit && statusLower === 'ongoing' && (
        <ActionButton
          action="edit"
          label={t('buttons.edit', { defaultValue: 'Edit' })}
          onClick={onEdit}
          disabled={isSubmitting}
          isLoading={isSubmitting && currentAction === 'Edit'}
          loadingText={getLoadingMessage('edit')}
        />
      )}

      {renderApproveButtons()}

      {canBackToPrevious && (
        <ActionButton
          action="back"
          label={t('buttons.backToPrevious', { defaultValue: 'Back to Previous' })}
          onClick={onBackToPrevious}
          disabled={isSubmitting}
          isLoading={isSubmitting && currentAction === 'BackToPrevious'}
          loadingText={getLoadingMessage('backtoprevious')}
        />
      )}

      {canCancel && (
        <ActionButton
          action="cancel"
          label={t('buttons.cancel', { defaultValue: 'Cancel' })}
          onClick={onCancel}
          disabled={isSubmitting}
          isLoading={isSubmitting && currentAction === 'Cancel'}
          loadingText={getLoadingMessage('cancel')}
        />
      )}
    </div>
  );
};

export default ActionButtons;

