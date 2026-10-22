import { useEffect } from "react";
import { FaBarcode, FaTimes } from "react-icons/fa";
import {formatNumber} from "../../components/Fomatter.jsx";

export default function DiffPromoItemsModal({ promotionJob, onClose }) {
    useEffect(() => {
        const handleEscape = (event) => event.key === "Escape" && onClose();
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
            onMouseDown={onClose}
            role="presentation"
        >
            <section
                className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="diff-promo-items-title"
            >
                <header className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <FaBarcode aria-hidden="true" />
                        </div>
                        <div>
                            <h2 id="diff-promo-items-title" className="text-lg font-semibold text-slate-900">
                                Diff Promo Items
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {promotionJob?.branch?.branch_name ?? "Branch"} promotion price changes
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Close diff promo items"
                    >
                        <FaTimes />
                    </button>
                </header>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 text-sm sm:px-6">
                    <span className="text-slate-500">
                        Branch: <strong className="text-slate-800">{promotionJob?.branch?.branch_name ?? "-"}</strong>
                    </span>
                    <span className="text-slate-500">
                        Status: <strong className="capitalize text-slate-800">{promotionJob?.status ?? "-"}</strong>
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {promotionJob?.diff_promo_items?.length ?? 0} Diff Promo Items
                    </span>
                </div>

                <div className="max-h-[60vh] overflow-auto p-5 sm:p-6">
                    <table className="w-full min-w-[760px] overflow-hidden rounded-xl border border-slate-200 text-sm">
                        <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="border-b px-4 py-3">No.</th>
                                <th className="border-b px-4 py-3">Barcode</th>
                                <th className="border-b px-4 py-3 text-right">Goods Price</th>
                                <th className="border-b px-4 py-3 text-right">Cross Selling Value</th>
                                <th className="border-b px-4 py-3 text-right">Price Free</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* <tr className="hover:bg-blue-50/50">
                                <td className="px-4 py-3 text-slate-500">1</td>
                                <td className="px-4 py-3 font-mono font-medium">2000000503226</td>
                                <td className="px-4 py-3 text-right">฿3,900,001.00</td>
                                <td className="px-4 py-3 text-right font-medium text-rose-600">- ฿195,050.00</td>
                                <td className="px-4 py-3 text-right font-semibold text-emerald-700">฿3,704,951.00</td>
                            </tr>
                            <tr className="hover:bg-blue-50/50">
                                <td className="px-4 py-3 text-slate-500">2</td>
                                <td className="px-4 py-3 font-mono font-medium">2000000509556</td>
                                <td className="px-4 py-3 text-right">฿900,001.00</td>
                                <td className="px-4 py-3 text-right font-medium text-rose-600">- ฿15,000.00</td>
                                <td className="px-4 py-3 text-right font-semibold text-emerald-700">฿885,001.00</td>
                            </tr>
                            <tr className="hover:bg-blue-50/50">
                                <td className="px-4 py-3 text-slate-500">3</td>
                                <td className="px-4 py-3 font-mono font-medium">2000000509730</td>
                                <td className="px-4 py-3 text-right">฿39,801.00</td>
                                <td className="px-4 py-3 text-right font-medium text-rose-600">- ฿2,000.00</td>
                                <td className="px-4 py-3 text-right font-semibold text-emerald-700">฿37,801.00</td>
                            </tr> */}

                                {promotionJob?.diff_promo_items?.map((diffPromoItem,idx) => (
                                    <>
                                    <tr className="hover:bg-blue-50/50">
                                        <td className="px-4 py-3 text-slate-500">{++idx}</td>
                                        <td className="px-4 py-3 font-mono font-medium">{diffPromoItem.promotion_cross_selling_barcode}</td>
                                        <td className="px-4 py-3 text-right">{formatNumber(diffPromoItem.promotion_cross_selling_goods_price)}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-rose-600">{formatNumber(diffPromoItem.promotion_cross_selling_value)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-700">{formatNumber(diffPromoItem.promotion_cross_selling_price_free)}</td>
                                    </tr>
                                    </>
                                ))}
                        </tbody>
                    </table>
                </div>

                <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </footer>
            </section>
        </div>
    );
}
