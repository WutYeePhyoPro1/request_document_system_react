const CctvCheckbox = ({ label, name, checked, onChange, required }) => {
    return (
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className="toggle"
            // className="accent-blue-500 w-4 h-4"
            />
            <label className="text-sm font-medium">{label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
        </div>
    );
};

export default CctvCheckbox;

