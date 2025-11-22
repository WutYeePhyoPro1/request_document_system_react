import React from "react";
import Modal from "react-modal";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  X,
  DollarSign,
  Tag,
  Barcode,
  Type,
  Package,
  Layers,
} from "lucide-react";

Modal.setAppElement("#root");

const getBrowserOrigin = () =>
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";

const deriveApiBaseUrl = () => {
  const fallbackOrigin = getBrowserOrigin();
  const raw = import.meta.env?.VITE_API_URL;

  if (!raw) {
    return fallbackOrigin;
  }

  try {
    const parsed = new URL(raw, fallbackOrigin || "http://localhost");
    const trimmedPath = parsed.pathname.replace(/\/api\/?$/, "");
    const base = `${parsed.origin}${trimmedPath}`.replace(/\/$/, "");
    return base || parsed.origin;
  } catch (error) {
    return fallbackOrigin;
  }
};

const API_BASE_URL = deriveApiBaseUrl();

const ensureAbsoluteUrl = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (/^(?:data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    if (typeof window !== "undefined" && window.location?.protocol) {
      return `${window.location.protocol}${trimmed}`;
    }
    return `https:${trimmed}`;
  }

  if (!API_BASE_URL) {
    return trimmed;
  }

  const normalized = trimmed
    .replace(/^\.\//, "")
    .replace(/^\/+/, "/");

  return `${API_BASE_URL}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
};

const testImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AkEEjYXFQZ2SQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAJklEQVQ4y2NgGAWjYBSMglEwCkYBCQALiP/9+zcDpQALCwvDqA5GdTAKRsEoGAXDFjAAABFwAv+W5JZRAAAAAElFTkSuQmCC";

const resolveImageEntries = (product = {}) => {
  const toArray = (candidate) => {
    if (!candidate) return [];
    return Array.isArray(candidate) ? candidate : [candidate];
  };

  const candidates = [
    ...toArray(product.img),
    ...toArray(product.images),
    ...toArray(product.damage_images),
    ...toArray(product.photos),
    ...toArray(product.attachments),
  ];

  const seen = new Set();

  const normalizeEntry = (entry) => {
    if (!entry) return null;

    if (typeof entry === "string") {
      return ensureAbsoluteUrl(entry);
    }

    if (entry.value) {
      const nested = normalizeEntry(entry.value);
      if (nested) return nested;
    }

    const candidateSrc =
      entry.src ||
      entry.url ||
      entry.path ||
      entry.previewUrl ||
      entry.file ||
      entry.firstImage ||
      null;

    if (typeof candidateSrc === "string" && candidateSrc.trim().length > 0) {
      return ensureAbsoluteUrl(candidateSrc);
    }

    return null;
  };

  return candidates
    .map(normalizeEntry)
    .filter((src) => {
      if (!src) return false;
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    });
};

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  loading = false,
  onDelete,
}) {
  if (!product) return null;

  const resolvedImages = Array.isArray(product.modalImages) && product.modalImages.length
    ? product.modalImages
    : resolveImageEntries(product);
  const images = resolvedImages.length ? resolvedImages : [];

  const Field = ({ icon: Icon, label, value, valueColor }) => (
    <div className="flex gap-2">
      <Icon size={18} className="text-gray-500 shrink-0" />
      <div>
        <p className="font-semibold text-gray-400 text-xs uppercase">{label}</p>
        <p className={`text-gray-800 text-sm ${valueColor || ""}`}>{value}</p>
      </div>
    </div>
  );

  const productFields = [
    { icon: Tag, label: "Product Category", value: product.category },
    { icon: Barcode, label: "Product Code", value: product.code },
    { icon: Type, label: "Product Name", value: product.name },
    {
      icon: DollarSign,
      label: "Amount",
      value: product.amount?.toLocaleString(),
      valueColor: "text-green-600 font-semibold",
    },
    { icon: Package, label: "Unit", value: product.unit },
    {
      icon: DollarSign,
      label: "Price",
      value: product.price?.toLocaleString() || "-",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      overlayClassName="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2"
      className="bg-transparent outline-none"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white w-full sm:w-[90%] max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
          >

            <div className="flex justify-between items-center p-3 border-b border-[#cde6eb]">
              <h3 className="text-green-700 font-semibold text-sm flex items-center gap-2">
                <FileText size={16} /> Product Information
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-[0.8rem] text-gray-700 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {productFields.map((field, index) => (
                  <Field
                    key={index}
                    icon={field.icon}
                    label={field.label}
                    value={field.value}
                    valueColor={field.valueColor}
                  />
                ))}
              </div>

              {/* Remark */}
              {product.remark && (
                <div className="mt-4 w-full bg-gray-100 p-3 rounded-lg">
                  <Field icon={Type} label="Remark" value={product.remark} />
                </div>
              )}

              {/* Qty Section */}
              <div className="bg-blue-100 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-2 items-center">
                    <Layers size={16} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-500">
                      System Qty
                    </p>
                  </div>
                  <p className="text-gray-800">{product.system_qty}</p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-2 items-center">
                    <Layers size={16} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-500">
                      Request Qty
                    </p>
                  </div>
                  <p className="text-gray-800">{product.request_qty}</p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-2 items-center">
                    <Layers size={16} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-500">
                      Final Qty
                    </p>
                  </div>
                  <p className="text-gray-800">{product.final_qty}</p>
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {images.length > 0
                  ? images.map((img, i) => (
                      <img
                        key={`product-image-${i}`}
                        src={img}
                        alt={`product-${i}`}
                        className="rounded-lg border border-gray-200 object-cover w-full h-28"
                        onError={(e) => {
                          e.currentTarget.src = testImage;
                        }}
                      />
                    ))
                  : [testImage].map((placeholder, index) => (
                      <div
                        key={`product-image-placeholder-${index}`}
                        className="rounded-lg border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center w-full h-28 text-gray-500 text-xs"
                      >
                        No image available
                      </div>
                    ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
