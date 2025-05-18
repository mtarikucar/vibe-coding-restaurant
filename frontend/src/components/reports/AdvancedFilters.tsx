import { useState, useEffect } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ReportType } from "../../services/reportApi";

interface AdvancedFiltersProps {
  reportType: ReportType;
  initialFilters: Record<string, any>;
  onClose: () => void;
  onSave: (filters: Record<string, any>) => void;
}

interface FilterField {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  reportType,
  initialFilters,
  onClose,
  onSave,
}) => {
  const [filters, setFilters] = useState<FilterField[]>([]);

  useEffect(() => {
    // Convert initialFilters object to array of FilterField objects
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      const filterFields: FilterField[] = [];
      
      // Handle complex filter structure
      if (initialFilters.conditions && Array.isArray(initialFilters.conditions)) {
        initialFilters.conditions.forEach((condition, index) => {
          filterFields.push({
            id: `filter-${index}`,
            field: condition.field || "",
            operator: condition.operator || "equals",
            value: condition.value || "",
          });
        });
      } else {
        // Handle simple key-value filters
        Object.entries(initialFilters).forEach(([key, value], index) => {
          if (key !== "operator" && key !== "logic") {
            filterFields.push({
              id: `filter-${index}`,
              field: key,
              operator: "equals",
              value: value as string | number | boolean,
            });
          }
        });
      }
      
      setFilters(filterFields.length > 0 ? filterFields : [createEmptyFilter()]);
    } else {
      setFilters([createEmptyFilter()]);
    }
  }, [initialFilters]);

  const createEmptyFilter = (): FilterField => ({
    id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    field: "",
    operator: "equals",
    value: "",
  });

  const handleAddFilter = () => {
    setFilters([...filters, createEmptyFilter()]);
  };

  const handleRemoveFilter = (id: string) => {
    if (filters.length > 1) {
      setFilters(filters.filter((filter) => filter.id !== id));
    }
  };

  const handleFilterChange = (
    id: string,
    field: keyof FilterField,
    value: string | number | boolean
  ) => {
    setFilters(
      filters.map((filter) =>
        filter.id === id ? { ...filter, [field]: value } : filter
      )
    );
  };

  const handleSave = () => {
    // Convert filters array to object structure
    const filtersObject: Record<string, any> = {
      logic: "and",
      conditions: filters
        .filter((filter) => filter.field && filter.operator)
        .map((filter) => ({
          field: filter.field,
          operator: filter.operator,
          value: filter.value,
        })),
    };
    
    onSave(filtersObject);
    onClose();
  };

  // Get available fields based on report type
  const getAvailableFields = () => {
    switch (reportType) {
      case ReportType.SALES:
        return [
          { value: "totalAmount", label: "Total Amount" },
          { value: "date", label: "Date" },
          { value: "paymentMethod", label: "Payment Method" },
          { value: "status", label: "Status" },
          { value: "waiterId", label: "Waiter" },
          { value: "tableId", label: "Table" },
        ];
      case ReportType.INVENTORY:
        return [
          { value: "quantity", label: "Quantity" },
          { value: "minQuantity", label: "Minimum Quantity" },
          { value: "isLowStock", label: "Low Stock" },
          { value: "categoryId", label: "Category" },
          { value: "supplier", label: "Supplier" },
        ];
      case ReportType.USERS:
        return [
          { value: "role", label: "Role" },
          { value: "createdAt", label: "Created Date" },
          { value: "lastLogin", label: "Last Login" },
          { value: "isActive", label: "Active Status" },
        ];
      case ReportType.ORDERS:
        return [
          { value: "status", label: "Status" },
          { value: "totalAmount", label: "Total Amount" },
          { value: "createdAt", label: "Created Date" },
          { value: "waiterId", label: "Waiter" },
          { value: "tableId", label: "Table" },
        ];
      case ReportType.PAYMENTS:
        return [
          { value: "method", label: "Payment Method" },
          { value: "status", label: "Status" },
          { value: "amount", label: "Amount" },
          { value: "createdAt", label: "Created Date" },
        ];
      default:
        return [
          { value: "createdAt", label: "Created Date" },
          { value: "updatedAt", label: "Updated Date" },
        ];
    }
  };

  // Get available operators
  const getOperators = (fieldType: string) => {
    const numericOperators = [
      { value: "equals", label: "Equals" },
      { value: "notEquals", label: "Not Equals" },
      { value: "greaterThan", label: "Greater Than" },
      { value: "lessThan", label: "Less Than" },
      { value: "greaterThanOrEquals", label: "Greater Than or Equals" },
      { value: "lessThanOrEquals", label: "Less Than or Equals" },
    ];

    const stringOperators = [
      { value: "equals", label: "Equals" },
      { value: "notEquals", label: "Not Equals" },
      { value: "contains", label: "Contains" },
      { value: "startsWith", label: "Starts With" },
      { value: "endsWith", label: "Ends With" },
    ];

    const dateOperators = [
      { value: "equals", label: "Equals" },
      { value: "notEquals", label: "Not Equals" },
      { value: "before", label: "Before" },
      { value: "after", label: "After" },
      { value: "between", label: "Between" },
    ];

    const booleanOperators = [
      { value: "equals", label: "Equals" },
      { value: "notEquals", label: "Not Equals" },
    ];

    // Determine field type based on field name
    if (fieldType.includes("amount") || fieldType.includes("quantity") || fieldType.includes("price")) {
      return numericOperators;
    } else if (fieldType.includes("date") || fieldType.includes("At")) {
      return dateOperators;
    } else if (fieldType.includes("is") || fieldType === "active") {
      return booleanOperators;
    } else {
      return stringOperators;
    }
  };

  const availableFields = getAvailableFields();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Advanced Filters
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Add filters to narrow down your report data. All conditions will be combined with AND logic.
            </p>
          </div>

          <div className="space-y-4">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-grow">
                  <select
                    value={filter.field}
                    onChange={(e) =>
                      handleFilterChange(filter.id, "field", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Field</option>
                    {availableFields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-grow">
                  <select
                    value={filter.operator}
                    onChange={(e) =>
                      handleFilterChange(filter.id, "operator", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {getOperators(filter.field).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-grow">
                  <input
                    type="text"
                    value={filter.value as string}
                    onChange={(e) =>
                      handleFilterChange(filter.id, "value", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Value"
                  />
                </div>

                <div>
                  <button
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                    title="Remove Filter"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={handleAddFilter}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Filter
            </button>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;
