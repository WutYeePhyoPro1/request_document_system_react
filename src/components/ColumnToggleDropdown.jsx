import { useState } from "react";
import { FaCheck, FaTable, FaChevronDown } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toggleColumn, setAllColumns, clearColumns } from "./../store/pricechangeSlice";

export default function ColumnToggleDropdown({ columns }) {
  const [open, setOpen] = useState(false);

  const dispatch = useDispatch();
  const visibleColumns = useSelector(
    (state) => state.pricechanges.visibleColumns
  );

  const isVisible = (slug) => visibleColumns.includes(slug);

  return (
    <div className="relative inline-block">
      
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
      >
        <FaTable className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Columns</span>
        <FaChevronDown className="text-gray-600" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute mb-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden right-0 bottom-full">

          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
            <span className="text-xs font-semibold text-gray-500">
              Show / Hide Columns
            </span>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => dispatch(setAllColumns(columns.map(c => c.slug)))}
                className="text-blue-500 hover:underline"
              >
                All
              </button>

              <button
                onClick={() => dispatch(clearColumns())}
                className="text-red-500 hover:underline"
              >
                None
              </button>
            </div>
          </div>

          {/* Column List */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {columns.filter(c => !c.display).map((col) => {
              
              if (col.requireAuth) return null;

              const checked = isVisible(col.slug);

              return (
                <div
                  key={col.slug}
                  onClick={() => dispatch(toggleColumn(col.slug))}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition 
                    ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <span className="text-sm text-gray-700">
                    {col.name}
                  </span>

                  {checked && (
                    <FaCheck className="text-blue-500 text-xs" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t text-right">
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}