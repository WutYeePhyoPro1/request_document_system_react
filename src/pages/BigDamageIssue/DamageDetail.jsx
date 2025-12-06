import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DamageFormLayout from "../../components/DamageForm/DamageFormLayout";
import { toast } from 'react-toastify';
import { XCircle } from 'lucide-react';

export default function DamageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormData = async () => {
      if (!id) {
        setError('No form ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if we have notification data in sessionStorage
        const notificationData = sessionStorage.getItem('lastNotification');
        if (notificationData) {
          try {
            const notification = JSON.parse(notificationData);
            const notificationFormId = typeof notification.specific_form_id === 'string' 
              ? parseInt(notification.specific_form_id, 10) 
              : notification.specific_form_id;
              
            const currentFormId = typeof id === 'string' ? parseInt(id, 10) : id;
            
            if (notificationFormId === currentFormId) {
              // Clear the notification data after using it
              sessionStorage.removeItem('lastNotification');
              
              // If the notification has form data, use it
              if (notification.form_data) {
                setFormData(notification.form_data);
                return;
              }
            }
          } catch (err) {
            // Continue with normal fetch if there's an error with notification data
          }
        }

        // If no notification data or it doesn't match, fetch from API
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/big-damage-issues/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch form data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setFormData(data.data || data);
      } catch (err) {
        setError(err.message || 'Failed to load form data');
        toast.error('Failed to load form data. Please try again.');
        
        // Redirect to dashboard if there's an error
        setTimeout(() => {
          navigate('/big_damage_issue');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error || 'Failed to load form data'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <h1 className="text-xl font-semibold text-gray-800 mb-4 px-6">Big Damage Issue Detail</h1>
      <DamageFormLayout mode="view" initialData={formData} />
    </div>
  );
}
