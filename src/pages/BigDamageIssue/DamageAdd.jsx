import React from "react";
import DamageFormLayout from "../../components/DamageForm/DamageFormLayout";

export default function DamageAdd() {
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <DamageFormLayout mode="add" />
    </div>
  );
}
