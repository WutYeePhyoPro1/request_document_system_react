const CctvInput = ({ label, type, name, value, onChange, required }) => {
    return (
        <div>
            <label className="block font-medium">{label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                // className="border p-2 w-full rounded-md"
                className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
            />
        </div>
    );
};

export default CctvInput; ``