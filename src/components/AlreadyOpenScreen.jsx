import React from 'react';
import { useNavigate } from 'react-router-dom';

const AlreadyOpenScreen = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
      }}
    >
      <div
        style={{
          padding: '30px',
          borderRadius: '12px',
          backgroundColor: '#fff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>
          Form Already Open
        </h2>
        <p style={{ color: '#555', marginBottom: '20px' }}>
          This form is currently open in another tab. To prevent data conflicts,
          editing is disabled here.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {/* Retry button */}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>

          {/* Close button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #999',
              backgroundColor: '#fff',
              color: '#333',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlreadyOpenScreen;