import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  occupiedSince?: string;
  currentOrder?: string;
}

const Tables = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll just simulate data
    const mockTables = [
      {
        id: 1,
        number: 1,
        capacity: 2,
        status: 'available' as const,
      },
      {
        id: 2,
        number: 2,
        capacity: 4,
        status: 'occupied' as const,
        occupiedSince: '2023-05-17T14:30:00Z',
        currentOrder: 'ORD-002',
      },
      {
        id: 3,
        number: 3,
        capacity: 4,
        status: 'available' as const,
      },
      {
        id: 4,
        number: 4,
        capacity: 6,
        status: 'reserved' as const,
      },
      {
        id: 5,
        number: 5,
        capacity: 2,
        status: 'occupied' as const,
        occupiedSince: '2023-05-17T15:00:00Z',
        currentOrder: 'ORD-001',
      },
      {
        id: 6,
        number: 6,
        capacity: 8,
        status: 'available' as const,
      },
      {
        id: 7,
        number: 7,
        capacity: 4,
        status: 'available' as const,
      },
      {
        id: 8,
        number: 8,
        capacity: 6,
        status: 'occupied' as const,
        occupiedSince: '2023-05-17T14:45:00Z',
        currentOrder: 'ORD-003',
      },
    ];

    setTables(mockTables);
  }, []);

  const filteredTables = tables.filter(
    (table) => statusFilter === 'all' || table.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupiedTime = (occupiedSince?: string) => {
    if (!occupiedSince) return '';
    
    const occupied = new Date(occupiedSince);
    const now = new Date();
    const diffMs = now.getTime() - occupied.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    return diffMins < 60 
      ? `${diffMins} min${diffMins !== 1 ? 's' : ''}`
      : `${Math.floor(diffMins / 60)} hr${Math.floor(diffMins / 60) !== 1 ? 's' : ''} ${diffMins % 60} min${diffMins % 60 !== 1 ? 's' : ''}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Table Management</h2>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Table
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
          <div className="ml-auto flex space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Reserved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`bg-white rounded-lg shadow overflow-hidden border-t-4 ${
              table.status === 'available'
                ? 'border-green-500'
                : table.status === 'occupied'
                ? 'border-red-500'
                : 'border-blue-500'
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Table {table.number}</h3>
                  <p className="text-sm text-gray-500">Capacity: {table.capacity}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <PencilIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    table.status
                  )}`}
                >
                  {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                </span>
                {table.status === 'occupied' && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Occupied for: {getOccupiedTime(table.occupiedSince)}</p>
                    <p>Order: {table.currentOrder}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex space-x-2">
                {table.status === 'available' && (
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm w-full">
                    Seat Guests
                  </button>
                )}
                {table.status === 'occupied' && (
                  <>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex-1">
                      View Order
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex-1">
                      Clear Table
                    </button>
                  </>
                )}
                {table.status === 'reserved' && (
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm w-full">
                    Seat Guests
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tables;
