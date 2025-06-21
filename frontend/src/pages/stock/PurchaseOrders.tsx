import { useState, useEffect } from"react";
import {
 PlusIcon,
 PencilIcon,
 TrashIcon,
 ArrowPathIcon,
 XMarkIcon,
 EyeIcon,
 CheckCircleIcon,
} from"@heroicons/react/24/outline";
import { stockAPI } from"../../services/api";
import { formatDate, formatCurrency } from"../../utils/formatters";
import { useToast } from"../../components/common/ToastProvider";
import { PurchaseOrderStatus } from"../../types/stock";

interface Supplier {
 id: string;
 name: string;
}

interface Stock {
 id: string;
 menuItem: {
  id: string;
  name: string;
 };
 quantity: number;
 unit: string;
}

interface PurchaseOrderItem {
 id?: string;
 stockId: string;
 name: string;
 sku?: string;
 quantity: number;
 receivedQuantity?: number;
 unitPrice: number;
 taxRate?: number;
 discountAmount?: number;
 totalPrice?: number;
 notes?: string;
}

interface PurchaseOrder {
 id: string;
 orderNumber: string;
 status: PurchaseOrderStatus;
 supplier: Supplier;
 supplierId: string;
 expectedDeliveryDate?: string;
 deliveryDate?: string;
 subtotal: number;
 taxAmount: number;
 shippingAmount: number;
 discountAmount: number;
 totalAmount: number;
 notes?: string;
 internalNotes?: string;
 paymentTerms?: string;
 shippingMethod?: string;
 trackingNumber?: string;
 invoiceNumber?: string;
 invoiceDate?: string;
 isPaid: boolean;
 paidDate?: string;
 items: PurchaseOrderItem[];
 createdAt: string;
 updatedAt: string;
}

const PurchaseOrders = () => {
 const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
 const [stocks, setStocks] = useState<Stock[]>([]);
 const [searchQuery, setSearchQuery] = useState<string>("");
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const { showToast } = useToast();

 // Modal states
 const [showOrderModal, setShowOrderModal] = useState(false);
 const [showViewModal, setShowViewModal] = useState(false);
 const [showReceiveModal, setShowReceiveModal] = useState(false);
 const [modalMode, setModalMode] = useState<"create" |"edit">("create");
 const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
  null
 );

 // Form states
 const [formSupplierId, setFormSupplierId] = useState("");
 const [formExpectedDeliveryDate, setFormExpectedDeliveryDate] = useState("");
 const [formNotes, setFormNotes] = useState("");
 const [formInternalNotes, setFormInternalNotes] = useState("");
 const [formPaymentTerms, setFormPaymentTerms] = useState("");
 const [formShippingMethod, setFormShippingMethod] = useState("");
 const [formShippingAmount, setFormShippingAmount] = useState<number>(0);
 const [formItems, setFormItems] = useState<PurchaseOrderItem[]>([]);
 const [formError, setFormError] = useState<string | null>(null);

 // Receive modal states
 const [receiveItems, setReceiveItems] = useState<
  { id: string; receivedQuantity: number }[]
 >([]);

 const fetchPurchaseOrders = async () => {
  setLoading(true);
  setError(null);

  try {
   const data = await stockAPI.getPurchaseOrders();
   setPurchaseOrders(data);
  } catch (err) {
   console.error("Error fetching purchase orders:", err);
   setError("Failed to load purchase orders. Please try again.");
  } finally {
   setLoading(false);
  }
 };

 const fetchSuppliers = async () => {
  try {
   const data = await stockAPI.getSuppliers();
   setSuppliers(data);
  } catch (err) {
   console.error("Error fetching suppliers:", err);
  }
 };

 const fetchStocks = async () => {
  try {
   const data = await stockAPI.getStocks();
   setStocks(data);
  } catch (err) {
   console.error("Error fetching stocks:", err);
  }
 };

 useEffect(() => {
  fetchPurchaseOrders();
  fetchSuppliers();
  fetchStocks();
 }, []);

 const resetForm = () => {
  setFormSupplierId("");
  setFormExpectedDeliveryDate("");
  setFormNotes("");
  setFormInternalNotes("");
  setFormPaymentTerms("");
  setFormShippingMethod("");
  setFormShippingAmount(0);
  setFormItems([]);
  setFormError(null);
 };

 const addItemToForm = () => {
  if (stocks.length === 0) return;

  const newItem: PurchaseOrderItem = {
   stockId: stocks[0].id,
   name: stocks[0].menuItem.name,
   quantity: 1,
   unitPrice: 0,
  };

  setFormItems([...formItems, newItem]);
 };

 const updateFormItem = (
  index: number,
  field: keyof PurchaseOrderItem,
  value: any
 ) => {
  const updatedItems = [...formItems];
  updatedItems[index] = { ...updatedItems[index], [field]: value };

  // If stock changed, update name
  if (field ==="stockId") {
   const stock = stocks.find((s) => s.id === value);
   if (stock) {
    updatedItems[index].name = stock.menuItem.name;
   }
  }

  // Calculate total price
  if (field ==="quantity" || field === "unitPrice") {
   const quantity =
    field ==="quantity" ? value : updatedItems[index].quantity;
   const unitPrice =
    field ==="unitPrice" ? value : updatedItems[index].unitPrice;
   updatedItems[index].totalPrice = quantity * unitPrice;
  }

  setFormItems(updatedItems);
 };

 const removeFormItem = (index: number) => {
  const updatedItems = [...formItems];
  updatedItems.splice(index, 1);
  setFormItems(updatedItems);
 };

 const calculateOrderTotals = () => {
  const subtotal = formItems.reduce((sum, item) => {
   return sum + item.quantity * item.unitPrice;
  }, 0);

  const taxAmount = formItems.reduce((sum, item) => {
   const itemTax = item.taxRate
    ? (item.quantity * item.unitPrice * item.taxRate) / 100
    : 0;
   return sum + itemTax;
  }, 0);

  const discountAmount = formItems.reduce((sum, item) => {
   return sum + (item.discountAmount || 0);
  }, 0);

  const totalAmount =
   subtotal + taxAmount + formShippingAmount - discountAmount;

  return {
   subtotal,
   taxAmount,
   discountAmount,
   totalAmount,
  };
 };

 const handleCreatePurchaseOrder = async () => {
  if (!formSupplierId) {
   setFormError("Supplier is required");
   return;
  }

  if (formItems.length === 0) {
   setFormError("At least one item is required");
   return;
  }

  for (const item of formItems) {
   if (!item.stockId || item.quantity <= 0 || item.unitPrice < 0) {
    setFormError(
    "All items must have a valid stock, quantity, and unit price"
    );
    return;
   }
  }

  setFormError(null);

  try {
   const { subtotal, taxAmount, discountAmount, totalAmount } =
    calculateOrderTotals();

   const orderData = {
    supplierId: formSupplierId,
    expectedDeliveryDate: formExpectedDeliveryDate || undefined,
    notes: formNotes || undefined,
    internalNotes: formInternalNotes || undefined,
    paymentTerms: formPaymentTerms || undefined,
    shippingMethod: formShippingMethod || undefined,
    shippingAmount: formShippingAmount,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    items: formItems,
   };

   if (modalMode ==="create") {
    await stockAPI.createPurchaseOrder(orderData);
    showToast("success","Purchase order created successfully");
   } else {
    await stockAPI.updatePurchaseOrder(selectedOrder!.id, orderData);
    showToast("success","Purchase order updated successfully");
   }

   setShowOrderModal(false);
   resetForm();
   fetchPurchaseOrders();
  } catch (err) {
   console.error("Error saving purchase order:", err);
   setFormError("Failed to save purchase order. Please try again.");
  }
 };

 const handleDeletePurchaseOrder = async (id: string) => {
  if (!confirm("Are you sure you want to delete this purchase order?"))
   return;

  try {
   await stockAPI.deletePurchaseOrder(id);
   showToast("success","Purchase order deleted successfully");
   fetchPurchaseOrders();
  } catch (err) {
   console.error("Error deleting purchase order:", err);
   showToast("error","Failed to delete purchase order");
  }
 };

 const handleReceivePurchaseOrder = async () => {
  if (!selectedOrder) return;

  try {
   await stockAPI.receivePurchaseOrder(selectedOrder.id, {
    items: receiveItems,
   });
   showToast("success","Items received successfully");
   setShowReceiveModal(false);
   fetchPurchaseOrders();
  } catch (err) {
   console.error("Error receiving items:", err);
   showToast("error","Failed to receive items");
  }
 };

 const openCreateModal = () => {
  resetForm();
  setModalMode("create");
  setShowOrderModal(true);
 };

 const openEditModal = (order: PurchaseOrder) => {
  setSelectedOrder(order);
  setFormSupplierId(order.supplierId);
  setFormExpectedDeliveryDate(
   order.expectedDeliveryDate ? order.expectedDeliveryDate.split("T")[0] :""
  );
  setFormNotes(order.notes ||"");
  setFormInternalNotes(order.internalNotes ||"");
  setFormPaymentTerms(order.paymentTerms ||"");
  setFormShippingMethod(order.shippingMethod ||"");
  setFormShippingAmount(order.shippingAmount);
  setFormItems(order.items);
  setModalMode("edit");
  setShowOrderModal(true);
 };

 const openViewModal = (order: PurchaseOrder) => {
  setSelectedOrder(order);
  setShowViewModal(true);
 };

 const openReceiveModal = (order: PurchaseOrder) => {
  setSelectedOrder(order);
  // Initialize receive items with remaining quantities
  const items = order.items.map((item) => ({
   id: item.id!,
   receivedQuantity: 0,
  }));
  setReceiveItems(items);
  setShowReceiveModal(true);
 };

 const updateReceiveItem = (index: number, value: number) => {
  const updatedItems = [...receiveItems];
  updatedItems[index].receivedQuantity = value;
  setReceiveItems(updatedItems);
 };

 const getStatusBadgeClass = (status: PurchaseOrderStatus) => {
  switch (status) {
   case"draft":
    return"bg-gray-100 text-gray-800";
   case"pending":
    return"bg-yellow-100 text-yellow-800";
   case"approved":
    return"bg-blue-100 text-blue-800";
   case"ordered":
    return"bg-indigo-100 text-indigo-800";
   case"partially_received":
    return"bg-purple-100 text-purple-800";
   case"received":
    return"bg-green-100 text-green-800";
   case"canceled":
    return"bg-red-100 text-red-800";
   default:
    return"bg-gray-100 text-gray-800";
  }
 };

 const filteredOrders = purchaseOrders.filter((order) => {
  const matchesSearch =
   order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
   order.supplier.name.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesStatus =
   statusFilter ==="all" || order.status === statusFilter;

  return matchesSearch && matchesStatus;
 });

 return (
  <div>
   <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
    <div className="flex space-x-2">
     <button
      onClick={fetchPurchaseOrders}
      className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
      title="Refresh purchase orders"
     >
      <ArrowPathIcon className="h-5 w-5" />
     </button>
     <button
      onClick={openCreateModal}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
     >
      <PlusIcon className="h-5 w-5 mr-2" />
      New Order
     </button>
    </div>
   </div>

   {error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
     <p>{error}</p>
     <button
      onClick={fetchPurchaseOrders}
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
       placeholder="Search orders..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
      />
     </div>
     <div>
      <label
       htmlFor="status"
       className="block text-sm font-medium text-gray-700 mb-1"
      >
       Status
      </label>
      <select
       id="status"
       className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
       value={statusFilter}
       onChange={(e) => setStatusFilter(e.target.value)}
      >
       <option value="all">All Statuses</option>
       <option value="draft">Draft</option>
       <option value="pending">Pending</option>
       <option value="approved">Approved</option>
       <option value="ordered">Ordered</option>
       <option value="partially_received">Partially Received</option>
       <option value="received">Received</option>
       <option value="canceled">Canceled</option>
      </select>
     </div>
    </div>
   </div>

   <div className="bg-white rounded-lg shadow overflow-hidden">
    {loading ? (
     <div className="p-8 text-center text-gray-500">
      Loading purchase orders...
     </div>
    ) : filteredOrders.length > 0 ? (
     <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
       <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Order #
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Supplier
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Date
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Total
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Actions
        </th>
       </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
       {filteredOrders.map((order) => (
        <tr key={order.id}>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
           {order.orderNumber}
          </div>
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
           {order.supplier.name}
          </div>
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
           {formatDate(order.createdAt)}
          </div>
          {order.expectedDeliveryDate && (
           <div className="text-xs text-gray-500">
            Expected: {formatDate(order.expectedDeliveryDate)}
           </div>
          )}
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <span
           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
            order.status
           )}`}
          >
           {order.status.replace("_"," ")}
          </span>
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
           {formatCurrency(order.totalAmount)}
          </div>
          <div className="text-xs text-gray-500">
           {order.items.length} items
          </div>
         </td>
         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex space-x-2">
           <button
            className="text-blue-600 hover:text-blue-900"
            title="View order"
            onClick={() => openViewModal(order)}
           >
            <EyeIcon className="h-5 w-5" />
           </button>
           {(order.status ==="draft" ||
            order.status ==="pending") && (
            <button
             className="text-indigo-600 hover:text-indigo-900"
             title="Edit order"
             onClick={() => openEditModal(order)}
            >
             <PencilIcon className="h-5 w-5" />
            </button>
           )}
           {(order.status ==="ordered" ||
            order.status ==="partially_received") && (
            <button
             className="text-green-600 hover:text-green-900"
             title="Receive items"
             onClick={() => openReceiveModal(order)}
            >
             <CheckCircleIcon className="h-5 w-5" />
            </button>
           )}
           {(order.status ==="draft" ||
            order.status ==="pending") && (
            <button
             className="text-red-600 hover:text-red-900"
             title="Delete order"
             onClick={() => handleDeletePurchaseOrder(order.id)}
            >
             <TrashIcon className="h-5 w-5" />
            </button>
           )}
          </div>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    ) : (
     <div className="p-8 text-center text-gray-500">
      No purchase orders found matching your filters.
     </div>
    )}
   </div>

   {/* Purchase Order Modal */}
   {/* This would be a large component with forms for creating/editing purchase orders */}
   {/* View Modal */}
   {/* This would show purchase order details */}
   {/* Receive Modal */}
   {/* This would allow receiving items */}
  </div>
 );
};

export default PurchaseOrders;
