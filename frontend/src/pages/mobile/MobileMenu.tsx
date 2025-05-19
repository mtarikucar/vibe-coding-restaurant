import React, { useState, useEffect } from "react";
import { menuAPI } from "../../services/api";
import { type Category, type MenuItem } from "../../types/menu";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatters";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const MobileMenu: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await menuAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const data = await menuAPI.getMenuItems();
      setMenuItems(data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
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
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
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
                    <div className="mt-2 flex items-center">
                      <span className="text-blue-600 font-medium">
                        {formatCurrency(item.price)}
                      </span>
                      {!item.isAvailable && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {t("menu.unavailable")}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.imageUrl && (
                    <div className="ml-4 flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-16 w-16 object-cover rounded"
                      />
                    </div>
                  )}
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
  );
};

export default MobileMenu;
