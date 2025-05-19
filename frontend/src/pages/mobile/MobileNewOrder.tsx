import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { menuAPI, tableAPI, orderAPI } from "../../services/api";
import { type Category, type  MenuItem } from "../../types/menu";
import { TableStatus } from "../../types/order";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatters";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../store/authStore";
import { useToast } from "../../components/common/ToastProvider";

// Define Table interface locally to avoid import issues
interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

const MobileNewOrder: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { success, error } = useToast();

  useEffect(() => {
    if (tableId) {
      fetchTableDetails();
      fetchCategories();
      fetchMenuItems();
    }
  }, [tableId]);

  const fetchTableDetails = async () => {
    try {
      const tableData = await tableAPI.getTable(tableId!);
      setTable(tableData);
    } catch (err) {
      console.error("Error fetching table details:", err);
      error(t("tables.fetchError"));
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await menuAPI.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const data = await menuAPI.getMenuItems();
      setMenuItems(data);
    } catch (err) {
      console.error("Error fetching menu items:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setLoading(true);

    try {
      if (categoryId === "all") {
        const data = await menuAPI.getMenuItems();
        setMenuItems(data);
      } else {
        const data = await menuAPI.getMenuItemsByCategory(categoryId);
        setMenuItems(data);
      }
    } catch (err) {
      console.error("Error fetching menu items:", err);
    } finally {
      setLoading(false);
    }
  };

  const addItemToOrder = (item: MenuItem) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find(
        (orderItem) => orderItem.menuItemId === item.id
      );

      if (existingItem) {
        return prevItems.map((orderItem) =>
          orderItem.menuItemId === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      } else {
        return [
          ...prevItems,
          {
            menuItemId: item.id,
            menuItem: item,
            quantity: 1,
          },
        ];
      }
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }

    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItemId === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeItemFromOrder = (itemId: string) => {
    setOrderItems((prevItems) =>
      prevItems.filter((item) => item.menuItemId !== itemId)
    );
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItemId === itemId ? { ...item, notes } : item
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      error(t("orders.emptyOrderError"));
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        tableId: tableId,
        waiterId: user?.id,
        items: orderItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes || "",
        })),
        notes: notes,
      };

      const response = await orderAPI.createOrder(orderData);
      success(t("orders.createSuccess"));
      navigate(`/mobile/orders/${response.id}`);
    } catch (err) {
      console.error("Error creating order:", err);
      error(t("orders.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch && item.isAvailable;
  });

  return (
    <div className="pb-24">
      {/* Menu section */}
      <div className="p-4">
        <div className="mb-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder={t("menu.search")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        <div className="mb-4 flex overflow-x-auto pb-2">
          <button
            className={`px-4 py-2 rounded-full mr-2 text-sm font-medium whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
            onClick={() => handleCategoryChange("all")}
          >
            {t("menu.allCategories")}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full mr-2 text-sm font-medium whitespace-nowrap ${
                selectedCategory === category.id
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="text-blue-600 font-medium">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2"
                        onClick={() => addItemToOrder(item)}
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">{t("menu.noItems")}</p>
          </div>
        )}
      </div>

      {/* Order summary fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("orders.summary")}
          </h3>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
          onClick={handleSubmitOrder}
          disabled={orderItems.length === 0 || submitting}
        >
          {submitting ? t("common.processing") : t("orders.placeOrder")}
        </button>
      </div>

      {/* Order items drawer */}
      {orderItems.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 max-h-64 overflow-y-auto">
          <div className="p-4 space-y-4">
            {orderItems.map((item) => (
              <div
                key={item.menuItemId}
                className="flex justify-between items-center"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {item.menuItem.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(item.menuItem.price)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700"
                    onClick={() =>
                      updateItemQuantity(item.menuItemId, item.quantity - 1)
                    }
                  >
                    <MinusIcon className="h-5 w-5" />
                  </button>
                  <span className="mx-2 w-8 text-center">{item.quantity}</span>
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700"
                    onClick={() =>
                      updateItemQuantity(item.menuItemId, item.quantity + 1)
                    }
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-1 ml-2 text-red-500 hover:text-red-700"
                    onClick={() => removeItemFromOrder(item.menuItemId)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNewOrder;
