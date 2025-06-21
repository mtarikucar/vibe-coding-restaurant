import { useState } from"react";
import { XMarkIcon, MagnifyingGlassIcon } from"@heroicons/react/24/outline";
import { TemplateCategory, ReportType } from"../../services/reportApi";
import {type ReportTemplate } from"../../types/report.types";

interface ReportTemplateSelectorProps {
 templates: ReportTemplate[];
 onClose: () => void;
 onSelect: (template: ReportTemplate) => void;
}

const ReportTemplateSelector: React.FC<ReportTemplateSelectorProps> = ({
 templates,
 onClose,
 onSelect,
}) => {
 const [searchTerm, setSearchTerm] = useState("");
 const [selectedCategory, setSelectedCategory] = useState<string>("all");
 const [selectedType, setSelectedType] = useState<string>("all");

 const filteredTemplates = templates.filter((template) => {
  const matchesSearch =
   template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
   (template.description &&
    template.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const matchesCategory =
   selectedCategory ==="all" || template.category === selectedCategory;

  const matchesType =
   selectedType ==="all" || template.type === selectedType;

  return matchesSearch && matchesCategory && matchesType;
 });

 const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(e.target.value);
 };

 const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setSelectedCategory(e.target.value);
 };

 const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setSelectedType(e.target.value);
 };

 return (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
   <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
    <div className="flex justify-between items-center p-6 border-b">
     <h2 className="text-xl font-semibold text-gray-800">
      Select a Report Template
     </h2>
     <button
      onClick={onClose}
      className="text-gray-500 hover:text-gray-700"
     >
      <XMarkIcon className="h-6 w-6" />
     </button>
    </div>

    <div className="p-6">
     <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
       <div className="relative flex-grow mb-4 md:mb-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
         <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
         type="text"
         value={searchTerm}
         onChange={handleSearch}
         className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
         placeholder="Search templates..."
        />
       </div>

       <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <select
         value={selectedCategory}
         onChange={handleCategoryChange}
         className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
         <option value="all">All Categories</option>
         <option value={TemplateCategory.FINANCIAL}>Financial</option>
         <option value={TemplateCategory.OPERATIONAL}>
          Operational
         </option>
         <option value={TemplateCategory.ANALYTICAL}>
          Analytical
         </option>
         <option value={TemplateCategory.CUSTOM}>Custom</option>
        </select>

        <select
         value={selectedType}
         onChange={handleTypeChange}
         className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
         <option value="all">All Types</option>
         <option value={ReportType.SALES}>Sales</option>
         <option value={ReportType.INVENTORY}>Inventory</option>
         <option value={ReportType.USERS}>Users</option>
         <option value={ReportType.ORDERS}>Orders</option>
         <option value={ReportType.PAYMENTS}>Payments</option>
         <option value={ReportType.CUSTOM}>Custom</option>
        </select>
       </div>
      </div>
     </div>

     {filteredTemplates.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {filteredTemplates.map((template) => (
        <div
         key={template.id}
         className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => onSelect(template)}
        >
         <div className="p-4">
          <div className="flex items-center justify-between mb-2">
           <h3 className="text-lg font-medium text-gray-900 truncate">
            {template.name}
           </h3>
           <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
             template.isSystem
              ?"bg-purple-100 text-purple-800"
              :"bg-blue-100 text-blue-800"
            }`}
           >
            {template.isSystem ?"System" : "Custom"}
           </span>
          </div>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
           {template.description ||"No description"}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
           <span>{template.type}</span>
           <span>{template.category}</span>
          </div>
         </div>
        </div>
       ))}
      </div>
     ) : (
      <div className="text-center py-12">
       <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
       >
        <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={1.5}
         d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
       </svg>
       <h3 className="mt-2 text-sm font-medium text-gray-900">
        No templates found
       </h3>
       <p className="mt-1 text-sm text-gray-500">
        Try adjusting your search or filter criteria.
       </p>
      </div>
     )}
    </div>

    <div className="flex justify-end p-6 border-t">
     <button
      onClick={onClose}
      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
     >
      Cancel
     </button>
    </div>
   </div>
  </div>
 );
};

export default ReportTemplateSelector;
