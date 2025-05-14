const CctvTextarea = ({ label, name, value, onChange, required }) => {
    return (
        <div>
            <label className="block font-medium">{label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
                rows="3"
            ></textarea>
        </div>
    );
};

export default CctvTextarea;
