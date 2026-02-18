import React, { useState } from 'react'

export default function CctvApprove({ generalForm, formRoute }) {

    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [charCount, setCharCount] = useState(0);

    return (
        <div className="approval-container">
            {/* We'll add the components here step by step */}
        </div>
    )
}
