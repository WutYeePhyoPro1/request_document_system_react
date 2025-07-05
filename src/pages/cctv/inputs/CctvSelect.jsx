

const CctvSelect = ({ label, name, options, value, onChange, required }) => {
    return (
        <div>
            <label className="block font-medium">{label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="border focus:outline-none 0 p-2 w-full rounded-md"
                style={{ borderColor: '#2ea2d1' }}
            >
                {/* <option value="">Select {label}</option> */}
                <option value="">Choose Reason</option>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CctvSelect;

