import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { stockAPI } from "../../services/api";
import { formatDate } from "../../utils/formatters";
import { useToast } from "../../components/common/ToastProvider";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website: string;
  taxId: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Modal states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  // Form states
  const [formName, setFormName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formPostalCode, setFormPostalCode] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formTaxId, setFormTaxId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await stockAPI.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Failed to load suppliers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormContactPerson("");
    setFormEmail("");
    setFormPhone("");
    setFormAddress("");
    setFormCity("");
    setFormState("");
    setFormCountry("");
    setFormPostalCode("");
    setFormWebsite("");
    setFormTaxId("");
    setFormNotes("");
    setFormIsActive(true);
    setFormError(null);
  };

  const handleCreateSupplier = async () => {
    if (!formName) {
      setFormError("Supplier name is required");
      return;
    }

    setFormError(null);

    try {
      const supplierData = {
        name: formName,
        contactPerson: formContactPerson,
        email: formEmail,
        phone: formPhone,
        address: formAddress,
        city: formCity,
        state: formState,
        country: formCountry,
        postalCode: formPostalCode,
        website: formWebsite,
        taxId: formTaxId,
        notes: formNotes,
        isActive: formIsActive,
      };

      if (modalMode === "create") {
        await stockAPI.createSupplier(supplierData);
        showToast("success", "Supplier created successfully");
      } else {
        await stockAPI.updateSupplier(selectedSupplier!.id, supplierData);
        showToast("success", "Supplier updated successfully");
      }

      setShowSupplierModal(false);
      resetForm();
      fetchSuppliers();
    } catch (err) {
      console.error("Error saving supplier:", err);
      setFormError("Failed to save supplier. Please try again.");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      await stockAPI.deleteSupplier(id);
      showToast("success", "Supplier deleted successfully");
      fetchSuppliers();
    } catch (err) {
      console.error("Error deleting supplier:", err);
      showToast("error", "Failed to delete supplier");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setShowSupplierModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormName(supplier.name);
    setFormContactPerson(supplier.contactPerson || "");
    setFormEmail(supplier.email || "");
    setFormPhone(supplier.phone || "");
    setFormAddress(supplier.address || "");
    setFormCity(supplier.city || "");
    setFormState(supplier.state || "");
    setFormCountry(supplier.country || "");
    setFormPostalCode(supplier.postalCode || "");
    setFormWebsite(supplier.website || "");
    setFormTaxId(supplier.taxId || "");
    setFormNotes(supplier.notes || "");
    setFormIsActive(supplier.isActive);
    setModalMode("edit");
    setShowSupplierModal(true);
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.contactPerson &&
        supplier.contactPerson
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (supplier.email &&
        supplier.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && supplier.isActive) ||
      (activeFilter === "inactive" && !supplier.isActive);

    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Supplier Management
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchSuppliers}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
            title="Refresh suppliers"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={openCreateModal}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Supplier
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button
            onClick={fetchSuppliers}
            className="mt-2 bg-red-200 hover:bg-red-300 text-red-700 px-3 py-1 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="active"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="active"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="all">All Suppliers</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading suppliers...
          </div>
        ) : filteredSuppliers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {supplier.name}
                    </div>
                    {supplier.website && (
                      <div className="text-sm text-gray-500">
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {supplier.website}
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {supplier.contactPerson && (
                      <div className="text-sm text-gray-900">
                        {supplier.contactPerson}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="text-sm text-gray-500">
                        <a
                          href={`mailto:${supplier.email}`}
                          className="text-blue-500 hover:underline"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="text-sm text-gray-500">
                        {supplier.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {supplier.city && supplier.country && (
                      <div className="text-sm text-gray-900">
                        {supplier.city}, {supplier.country}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        supplier.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit supplier"
                        onClick={() => openEditModal(supplier)}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Delete supplier"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No suppliers found matching your filters.
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === "create" ? "Add New Supplier" : "Edit Supplier"}
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formContactPerson}
                  onChange={(e) => setFormContactPerson(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formState}
                  onChange={(e) => setFormState(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formCountry}
                  onChange={(e) => setFormCountry(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formPostalCode}
                  onChange={(e) => setFormPostalCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ID
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formTaxId}
                  onChange={(e) => setFormTaxId(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSupplier}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                {modalMode === "create" ? "Create Supplier" : "Update Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
