import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { menuAPI } from "../../services/api";
import { type MenuItem, type Category } from "../../types/menu";
import { useToast } from "../../components/common/ToastProvider";
import usePerformanceMonitoring from "../../hooks/usePerformanceMonitoring";
import MenuItemForm from "../../components/menu/MenuItemForm";
import CategoryManager from "../../components/menu/CategoryManager";

const Menu = () => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState({
    categories: false,
    menuItems: false,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize performance monitoring
  const { trackAsyncOperation } = usePerformanceMonitoring("Menu", {
    trackMount: true,
    trackRender: true,
    metadata: { component: "Menu" },
  });

  const fetchData = async () => {
    try {
      // Fetch categories
      setLoading((prev) => ({ ...prev, categories: true }));
      const categoriesData = await trackAsyncOperation("fetchCategories", () =>
        menuAPI.getCategories()
      );
      setCategories(categoriesData);
      setLoading((prev) => ({ ...prev, categories: false }));

      // Fetch menu items
      setLoading((prev) => ({ ...prev, menuItems: true }));
      const menuItemsData = await trackAsyncOperation("fetchMenuItems", () =>
        menuAPI.getMenuItems()
      );
      setMenuItems(menuItemsData);
      setLoading((prev) => ({ ...prev, menuItems: false }));
    } catch (err) {
      console.error("Error fetching menu data:", err);
      error(t("menu.fetchError", "Failed to load menu data"));
      setLoading({
        categories: false,
        menuItems: false,
      });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // In a real app, you would upload the image to a server
      // For now, we'll simulate an upload delay and return a placeholder URL
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a data URL for the image (this is just for demo purposes)
      // In a real app, you would get a URL from your server after uploading
      return URL.createObjectURL(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      throw new Error("Failed to upload image");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = () => {
    setShowAddModal(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setCurrentMenuItem(item);
    setShowEditModal(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (
      window.confirm(
        t("menu.deleteConfirm", "Are you sure you want to delete this item?")
      )
    ) {
      try {
        await trackAsyncOperation("deleteMenuItem", () =>
          menuAPI.deleteMenuItem(id)
        );
        success(t("menu.deleteSuccess", "Menu item deleted successfully"));
        fetchData(); // Refresh the data
      } catch (err) {
        console.error("Error deleting menu item:", err);
        error(t("menu.deleteError", "Failed to delete menu item"));
      }
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleManageCategories = () => {
    setShowCategoryModal(true);
  };

  const handleSaveMenuItem = async (menuItem: MenuItem) => {
    setIsSubmitting(true);
    try {
      let imageUrl = menuItem.imageUrl;

      // If there's a new image file, upload it
      if (menuItem.imageFile) {
        imageUrl = await uploadImage(menuItem.imageFile);
      }

      // Create a copy without the imageFile property
      const { imageFile, ...menuItemToSave } = menuItem;

      // Add the imageUrl from the upload
      const itemWithImage = {
        ...menuItemToSave,
        imageUrl,
      };

      if (menuItem.id && !menuItem.id.startsWith("temp-")) {
        // Update existing item
        await trackAsyncOperation("updateMenuItem", () =>
          menuAPI.updateMenuItem(menuItem.id, itemWithImage)
        );
        success(t("menu.updateSuccess", "Menu item updated successfully"));
      } else {
        // Create new item
        await trackAsyncOperation("createMenuItem", () =>
          menuAPI.createMenuItem(itemWithImage)
        );
        success(t("menu.createSuccess", "Menu item created successfully"));
      }

      // Close the modal and refresh data
      setShowAddModal(false);
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error("Error saving menu item:", err);
      error(t("menu.saveError", "Failed to save menu item"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCategories = async (updatedCategories: Category[]) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would make API calls to create/update/delete categories
      // For now, we'll simulate a delay and update the local state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update the categories in the API
      await trackAsyncOperation("updateCategories", () =>
        menuAPI.updateCategories(updatedCategories)
      );

      success(t("menu.categoriesUpdated", "Categories updated successfully"));
      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      console.error("Error updating categories:", err);
      error(t("menu.categoriesError", "Failed to update categories"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("menu.title", "Menu Management")}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md flex items-center"
            title={t("common.refresh", "Refresh")}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleManageCategories}
            className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            {t("menu.manageCategories", "Manage Categories")}
          </button>
          <button
            onClick={handleAddItem}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t("menu.addItem", "Add Item")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("menu.category", "Category")}
              </label>
              <select
                id="category"
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">
                  {t("menu.allCategories", "All Categories")}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.search", "Search")}
              </label>
              <input
                type="text"
                id="search"
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t(
                  "menu.searchPlaceholder",
                  "Search menu items..."
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {loading.menuItems ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredItems.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("menu.item", "Item")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("menu.description", "Description")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("menu.price", "Price")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("menu.category", "Category")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("menu.status", "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.imageUrl && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={item.imageUrl}
                              alt={item.name}
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {item.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        $
                        {typeof item.price === "number"
                          ? item.price.toFixed(2)
                          : "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {categories.find((c) => c.id === item.categoryId)
                          ?.name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.isAvailable
                            ? "bg-success-100 text-success-800"
                            : "bg-danger-100 text-danger-800"
                        }`}
                      >
                        {item.isAvailable
                          ? t("menu.available", "Available")
                          : t("menu.unavailable", "Unavailable")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-primary-600 hover:text-primary-900"
                          title={t("common.edit", "Edit")}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-danger-600 hover:text-danger-900"
                          title={t("common.delete", "Delete")}
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
              {t("menu.noItems", "No menu items found.")}
            </div>
          )}
        </div>
      )}
      {/* Menu Item Form Modals */}
      <MenuItemForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveMenuItem}
        categories={categories}
        isLoading={isSubmitting}
      />

      <MenuItemForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveMenuItem}
        menuItem={currentMenuItem}
        categories={categories}
        isLoading={isSubmitting}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSave={handleSaveCategories}
        categories={categories}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Menu;
