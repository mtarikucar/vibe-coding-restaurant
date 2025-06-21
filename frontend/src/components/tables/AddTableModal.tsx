import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTableStore } from '../../store/tableStore';
import { TableStatus } from '../../types/table';
import { useTranslation } from 'react-i18next';

const AddTableModal: React.FC = () => {
 const { t } = useTranslation();
 const { isAddModalOpen, setAddModalOpen, createTable } = useTableStore();
 const [number, setNumber] = useState<number | ''>('');
 const [capacity, setCapacity] = useState<number | ''>('');
 const [status, setStatus] = useState<TableStatus>(TableStatus.AVAILABLE);
 const [location, setLocation] = useState<string>('');
 const [error, setError] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (number === '') {
   setError(t('tables.errors.numberRequired'));
   return;
  }

  if (capacity === '') {
   setError(t('tables.errors.capacityRequired'));
   return;
  }

  try {
   await createTable({
    number: Number(number),
    capacity: Number(capacity),
    status,
    location: location || undefined,
   });
   
   // Reset form
   setNumber('');
   setCapacity('');
   setStatus(TableStatus.AVAILABLE);
   setLocation('');
   setError(null);
  } catch (err) {
   console.error('Error creating table:', err);
   setError(t('tables.errors.createFailed'));
  }
 };

 if (!isAddModalOpen) return null;

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
   <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
    <div className="flex justify-between items-center p-4 border-b">
     <h2 className="text-xl font-semibold text-gray-800">{t('tables.addTable')}</h2>
     <button
      onClick={() => setAddModalOpen(false)}
      className="text-gray-500 hover:text-gray-700"
     >
      <XMarkIcon className="h-6 w-6" />
     </button>
    </div>
    
    <form onSubmit={handleSubmit} className="p-4">
     {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
       {error}
      </div>
     )}
     
     <div className="mb-4">
      <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
       {t('tables.tableNumber')}*
      </label>
      <input
       type="number"
       id="number"
       value={number}
       onChange={(e) => setNumber(e.target.value ? Number(e.target.value) : '')}
       className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
       min="1"
       required
      />
     </div>
     
     <div className="mb-4">
      <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
       {t('tables.capacity')}*
      </label>
      <input
       type="number"
       id="capacity"
       value={capacity}
       onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
       className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
       min="1"
       required
      />
     </div>
     
     <div className="mb-4">
      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
       {t('tables.status.label')}
      </label>
      <select
       id="status"
       value={status}
       onChange={(e) => setStatus(e.target.value as TableStatus)}
       className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
       <option value={TableStatus.AVAILABLE}>{t('tables.status.available')}</option>
       <option value={TableStatus.OCCUPIED}>{t('tables.status.occupied')}</option>
       <option value={TableStatus.RESERVED}>{t('tables.status.reserved')}</option>
       <option value={TableStatus.MAINTENANCE}>{t('tables.status.maintenance')}</option>
      </select>
     </div>
     
     <div className="mb-4">
      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
       {t('tables.location')}
      </label>
      <input
       type="text"
       id="location"
       value={location}
       onChange={(e) => setLocation(e.target.value)}
       className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
     </div>
     
     <div className="flex justify-end mt-6">
      <button
       type="button"
       onClick={() => setAddModalOpen(false)}
       className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2 hover:bg-gray-300"
      >
       {t('common.cancel')}
      </button>
      <button
       type="submit"
       className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
       {t('common.create')}
      </button>
     </div>
    </form>
   </div>
  </div>
 );
};

export default AddTableModal;
