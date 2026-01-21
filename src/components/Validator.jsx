export const validateForm = (datas, schema) => {
    const errors = {};
    for (const field in schema) {
        const rules = schema[field];
        const value = datas[field] ? datas[field].trim() : "";
        if (rules.required && !value) {
            errors[field] = `${field} is required`;
            continue;
        }
        if (rules.minLength && value.length < rules.minLength) {
            errors[field] = `${field} must be at least ${rules.minLength} characters.`;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            errors[field] = `${field} must be less than ${rules.maxLength} characters.`;
        }
        if (rules.type === "email") {
            if (!value.includes("@") || !value.includes(".")) {
                errors[field] = `${field} must be a valid email`;
            }
        }
        if (rules.type === "number") {
            if (isNaN(Number(value))) {
                errors[field] = `${field} must be a number`;
            }
        }
    }
    return errors;
};
