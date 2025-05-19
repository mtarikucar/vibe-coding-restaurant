import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { menuAPI, tableAPI, orderAPI } from "../../services/api";
import { type Category, type MenuItem } from "../../types/menu";
import { type Table, TableStatus } from "../../types/table";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatters";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../store/authStore";
import { useToast } from "../../components/common/ToastProvider";

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

const NewOrder: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tableId = queryParams.get("tableId");
  
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
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch table details if tableId is provided
        if (tableId) {
          const tableData = await tableAPI.getTable(tableId);
          setTable(tableData);
        }

        // Fetch menu categories
        const categoriesData = await menuAPI.getCategories();
        setCategories(categoriesData);

        // Fetch all menu items
        const menuItemsData = await menuAPI.getMenuItems();
        setMenuItems(menuItemsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        error(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableId, t, error]);

  const filteredMenuItems = menuItems.filter((item) => {
    // Filter by category
    const categoryMatch =
      selectedCategory === "all" || item.categoryId === selectedCategory;

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Only show available items
    return categoryMatch && searchMatch && item.isAvailable;
  });

  const handleAddItem = (item: MenuItem) => {
    const existingItem = orderItems.find((i) => i.menuItemId === item.id);

    if (existingItem) {
      // Update quantity if item already exists
      setOrderItems(
        orderItems.map((i) =>
          i.menuItemId === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    const existingItem = orderItems.find((i) => i.menuItemId === menuItemId);

    if (existingItem && existingItem.quantity > 1) {
      // Decrease quantity if more than 1
      setOrderItems(
        orderItems.map((i) =>
          i.menuItemId === menuItemId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
      );
    } else {
      // Remove item if quantity is 1
      setOrderItems(orderItems.filter((i) => i.menuItemId !== menuItemId));
    }
  };

  const handleDeleteItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter((i) => i.menuItemId !== menuItemId));
  };

  const handleUpdateNotes = (menuItemId: string, notes: string) => {
    setOrderItems(
      orderItems.map((i) =>
        i.menuItemId === menuItemId ? { ...i, notes } : i
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      error(t("orders.emptyOrderError"));
      return;
    }

    if (!tableId) {
      error(t("tables.notFound"));
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
      navigate(`/app/orders/${response.id}`);
    } catch (err) {
      console.error("Error creating order:", err);
      error(t("orders.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {t("orders.newOrder")}
          </h2>
        </div>
        {table && (
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
            <span className="font-medium">{t("tables.tableNumber", { number: table.number })}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
          <div className="mb-4">
            <div className="flex mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t("common.search")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex overflow-x-auto pb-2 mb-4">
              <button
                className={`px-4 py-2 rounded-full mr-2 text-sm font-medium whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("all")}
              >
                {t("menu.allCategories")}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-full mr-2 text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMenuItems.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  {t("menu.noItems")}
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-blue-600 font-medium mt-2">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2"
                          onClick={() => handleAddItem(item)}
                        >
                          <PlusIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Order Summary Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("orders.summary")}
          </h3>

          {orderItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("orders.noItems")}
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {orderItems.map((item) => (
                <div key={item.menuItemId} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => handleRemoveItem(item.menuItemId)}
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                      <span className="text-gray-700 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => handleAddItem({
                          id: item.menuItemId,
                          name: item.name,
                          price: item.price,
                          isAvailable: true,
                          categoryId: "",
                        } as MenuItem)}
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-400 hover:text-red-600 ml-2"
                        onClick={() => handleDeleteItem(item.menuItemId)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder={t("orders.notes")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={item.notes || ""}
                      onChange={(e) =>
                        handleUpdateNotes(item.menuItemId, e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <textarea
              placeholder={t("orders.notes")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{t("common.total")}</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleSubmitOrder}
              disabled={orderItems.length === 0 || submitting}
            >
              {submitting
                ? t("common.processing")
                : t("orders.placeOrder")}
            </button>
            <button
              className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium"
              onClick={handleCancel}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
