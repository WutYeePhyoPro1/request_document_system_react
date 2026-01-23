import Swal from 'sweetalert2';
export const validateForm = (datas, schema, messages = {}) => {
    const errors = {};
    for (const field in schema) {
        const rules = schema[field];
        // const value = datas[field] ? datas[field].trim() : "";
        const value =
        typeof datas[field] === 'string'
            ? datas[field].trim()
            : datas[field] ?? '';
        const fieldMessages = messages[field] || {};

        // console.log(field,value);
        if (rules.required &&    (
            value === null ||
            value === undefined ||
            value === '' ||
            (Array.isArray(value) && value.length === 0)
        )) {
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



export const validateArrayField = (
    items,
    field,
    rules,
    label = 'Item'
) => {
    const errors = {};

    items.forEach((item, index) => {
        const value = item[field];

        rules.forEach(rule => {

            if (rule === 'required') {
                if (value === '' || value === null || value === undefined) {
                    errors[`${label}_${index + 1}_${field}`] =
                        `${field} is required`;
                }
            }

            if (rule === 'numeric') {
                if (value !== '' && value !== null && isNaN(Number(value))) {
                    errors[`${label}_${index + 1}_${field}`] =
                        `${field} must be a number`;
                }
            }

        });
    });

    return errors;
};