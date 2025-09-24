// components/FormSelect.jsx
export default function FormSelect({ id, label, options = [], value, onChange }) {
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className="mb-1 font-medium text-gray-700">
                {label}
            </label>
            <select
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                style={{ borderColor: "#2ea2d1" }}
            >
                {options.map((opt, i) => (
                    <option key={i} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
