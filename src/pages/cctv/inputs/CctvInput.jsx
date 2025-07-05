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
                className="border focus:outline-none  p-2 w-full rounded-md"
                style={{ borderColor: '#2ea2d1' }}
            />
        </div>
    );
};

export default CctvInput; ``