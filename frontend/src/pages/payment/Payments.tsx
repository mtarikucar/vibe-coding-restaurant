import { useState, useEffect } from"react";
import { Link, useNavigate } from"react-router-dom";
import {
 CreditCardIcon,
 BanknotesIcon,
 ReceiptRefundIcon,
 CurrencyDollarIcon,
} from"@heroicons/react/24/outline";
import { paymentAPI } from"../../services/api";
import { formatCurrency } from"../../utils/formatters";

interface Payment {
 id: number;
 orderNumber: string;
 tableNumber: number;
 amount: number;
 method:"cash" | "credit_card" | "debit_card";
 status:"pending" | "completed" | "refunded";
 createdAt: string;
 cashier: string;
}

const Payments = () => {
 const navigate = useNavigate();
 const [payments, setPayments] = useState<Payment[]>([]);
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [methodFilter, setMethodFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState<string>("");
 const [loading, setLoading] = useState(false);

 useEffect(() => {
  const fetchPayments = async () => {
   setLoading(true);
   try {
    const data = await paymentAPI.getPayments();
    setPayments(data);
   } catch (error) {
    console.error("Error fetching payments:", error);
    // Fallback to mock data if API fails
    const mockPayments = [
     {
      id: 1,
      orderNumber:"ORD-001",
      tableNumber: 5,
      amount: 34.97,
      method:"credit_card" as const,
      status:"completed" as const,
      createdAt:"2023-05-17T15:30:00Z",
      cashier:"Jane Smith",
     },
     {
      id: 2,
      orderNumber:"ORD-002",
      tableNumber: 3,
      amount: 20.97,
      method:"cash" as const,
      status:"completed" as const,
      createdAt:"2023-05-17T15:45:00Z",
      cashier:"Jane Smith",
     },
     {
      id: 3,
      orderNumber:"ORD-003",
      tableNumber: 8,
      amount: 20.96,
      method:"debit_card" as const,
      status:"completed" as const,
      createdAt:"2023-05-17T14:15:00Z",
      cashier:"Jane Smith",
     },
     {
      id: 4,
      orderNumber:"ORD-004",
      tableNumber: 2,
      amount: 45.5,
      method:"credit_card" as const,
      status:"pending" as const,
      createdAt:"2023-05-17T16:00:00Z",
      cashier:"Jane Smith",
     },
    ];
    setPayments(mockPayments);
   } finally {
    setLoading(false);
   }
  };

  fetchPayments();
 }, []);

 const filteredPayments = payments.filter((payment) => {
  const matchesStatus =
   statusFilter ==="all" || payment.status === statusFilter;
  const matchesMethod =
   methodFilter ==="all" || payment.method === methodFilter;
  const matchesSearch =
   payment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
   payment.tableNumber.toString().includes(searchQuery);
  return matchesStatus && matchesMethod && matchesSearch;
 });

 const getStatusColor = (status: string) => {
  switch (status) {
   case"pending":
    return"bg-yellow-100 text-yellow-800";
   case"completed":
    return"bg-green-100 text-green-800";
   case"refunded":
    return"bg-red-100 text-red-800";
   default:
    return"bg-gray-100 text-gray-800";
  }
 };

 const getMethodIcon = (method: string) => {
  switch (method) {
   case"cash":
    return <BanknotesIcon className="h-5 w-5 text-green-500" />;
   case"credit_card":
   case"debit_card":
    return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
   case"stripe":
   case"paypal":
    return <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />;
   default:
    return null;
  }
 };

 const handleProcessPayment = (orderId: string) => {
  navigate(`/app/payments/process/${orderId}`);
 };

 return (
  <div>
   <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-800">Payment Management</h2>
   </div>

   <div className="bg-white rounded-lg shadow p-6 mb-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
     <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
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
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="refunded">Refunded</option>
       </select>
      </div>
      <div>
       <label
        htmlFor="method"
        className="block text-sm font-medium text-gray-700 mb-1"
       >
        Payment Method
       </label>
       <select
        id="method"
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={methodFilter}
        onChange={(e) => setMethodFilter(e.target.value)}
       >
        <option value="all">All Methods</option>
        <option value="cash">Cash</option>
        <option value="credit_card">Credit Card</option>
        <option value="debit_card">Debit Card</option>
        <option value="stripe">Stripe</option>
        <option value="paypal">PayPal</option>
       </select>
      </div>
      <div>
       <label
        htmlFor="search"
        className="block text-sm font-medium text-gray-700 mb-1"
       >
        Search
       </label>
       <input
        type="text"
        id="search"
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="Search by order # or table..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
       />
      </div>
     </div>
    </div>
   </div>

   <div className="bg-white rounded-lg shadow overflow-hidden">
    <table className="min-w-full divide-y divide-gray-200">
     <thead className="bg-gray-50">
      <tr>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Order #
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Table
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Amount
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Method
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Status
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Date & Time
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Actions
       </th>
      </tr>
     </thead>
     <tbody className="bg-white divide-y divide-gray-200">
      {filteredPayments.map((payment) => (
       <tr key={payment.id}>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm font-medium text-gray-900">
          {payment.orderNumber}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-500">
          Table {payment.tableNumber}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-900">
          ${payment.amount.toFixed(2)}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="flex items-center text-sm text-gray-500">
          {getMethodIcon(payment.method)}
          <span className="ml-1">
           {payment.method ==="credit_card"
            ?"Credit Card"
            : payment.method ==="debit_card"
            ?"Debit Card"
            : payment.method ==="stripe"
            ?"Stripe"
            : payment.method ==="paypal"
            ?"PayPal"
            :"Cash"}
          </span>
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
           payment.status
          )}`}
         >
          {payment.status.charAt(0).toUpperCase() +
           payment.status.slice(1)}
         </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-500">
          {new Date(payment.createdAt).toLocaleString()}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
         {payment.status ==="completed" && (
          <button className="text-red-600 hover:text-red-900 flex items-center">
           <ReceiptRefundIcon className="h-4 w-4 mr-1" />
           Refund
          </button>
         )}
         {payment.status ==="pending" && (
          <button
           onClick={() => handleProcessPayment(payment.orderId)}
           className="text-green-600 hover:text-green-900 flex items-center"
          >
           <CurrencyDollarIcon className="h-4 w-4 mr-1" />
           Process
          </button>
         )}
        </td>
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  </div>
 );
};

export default Payments;
