import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Toast: React.FC = () => {
  const { toastMsg } = useAuth();

  if (!toastMsg) return null;

  const isSuccess = toastMsg.type === 'success';
  const isError = toastMsg.type === 'error';

  return (
    <div
      className={`fixed bottom-[90px] left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-xs font-medium shadow-xl transition-all duration-300 z-[999] whitespace-nowrap text-white ${
        isSuccess ? 'bg-[#0A5C4A]' : isError ? 'bg-red-600' : 'bg-[#0D1F1A]'
      }`}
    >
      {toastMsg.text}
    </div>
  );
};
