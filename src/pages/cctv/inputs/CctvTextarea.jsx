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
                className="border focus:outline-none p-2 w-full rounded-md"
                rows="3"
                style={{ borderColor: '#2ea2d1' }}
            ></textarea>
        </div>
    );
};

export default CctvTextarea;
