// components/FormInput.jsx
export default function FormInput({ id, label, type = "text", placeholder, value, onChange }) {
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className="mb-1 font-medium text-gray-700">
                {label}
            </label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                onFocus={(e) => (e.target.style.borderColor = "#6fc3df")}
                onBlur={(e) => (e.target.style.borderColor = "#2ea2d1")}
                style={{ borderColor: "#2ea2d1" }}
            />
        </div>
    );
}
