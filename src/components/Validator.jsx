import Swal from 'sweetalert2';
export const validateForm = (datas, schema, messages = {}) => {
    const errors = {};
    for (const field in schema) {
        const rules = schema[field];
        const value = datas[field] ? datas[field].trim() : "";
        const fieldMessages = messages[field] || {};


        if (rules.required && !value) {
            errors[field] = fieldMessages.required || `${field} is required`;
            continue;
        }
        if (rules.minLength && value.length < rules.minLength) {
            errors[field] = fieldMessages.minLength || `${field} must be at least ${rules.minLength} characters`;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            errors[field] = fieldMessages.maxLength || `${field} must be less than ${rules.maxLength} characters`;
        }
        if (rules.type === "email") {
            if (!value.includes("@") || !value.includes(".")) {
                errors[field] = fieldMessages.type || `${field} must be a valid email`;
            }
        }
        if (rules.type === "number") {
            if (isNaN(Number(value))) {
                errors[field] = fieldMessages.type || `${field} must be a number`;
            }
        }
    }
    return errors;
};



export const showValidationErrors = (errors,title = 'Validation Error') => {
    if (!errors || Object.keys(errors).length === 0) {
        return false;
    }

    const errorMessages = Object.values(errors)
        .map(err => `<li style="
                margin-bottom:8px;
                padding:8px 12px;
                background:#fff4f4;
                border-left:4px solid #f87171;
                border-radius:4px;
                color:#7f1d1d;
                font-size:14px;
            ">${err}</li>`)
        .join('');

    Swal.fire({
        icon: 'error',
        title,
        // text: "Validation  failed",
        html: `<ul style="text-align:center; padding-left:20px;">${errorMessages}</ul>`,
        confirmButtonText: 'OK',
    });

    return true;
};