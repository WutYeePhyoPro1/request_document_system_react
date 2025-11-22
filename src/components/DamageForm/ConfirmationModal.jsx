import React from "react";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";

Modal.setAppElement("#root");

export default function ConfirmationModal({
  show,
  title = "Confirm",  
  message = "Are you sure?",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      isOpen={show}
      onRequestClose={onCancel}
      shouldCloseOnOverlayClick={true}
      closeTimeoutMS={0}
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      className="outline-none"
    >
      <AnimatePresence>
        {show && (
          <motion.div
            key="modal"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 22,
            }}
            className="relative bg-white rounded-xl p-6 w-96 shadow-2xl"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {title}
            </h2>

            <p className="mb-6 text-gray-600">{message}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
