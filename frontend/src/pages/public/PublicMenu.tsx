import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { menuAPI } from "../../services/api";
import { type Category, type MenuItem } from "../../types/menu";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatters";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const PublicMenu: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
    // Try to get restaurant name from localStorage or use a default
    const storedName = localStorage.getItem(`restaurant_name_${tenantId}`) || t("menu.defaultRestaurantName", "Restaurant Menu");
    setRestaurantName(storedName);
  }, [tenantId]);

  const fetchCategories = async () => {
    try {
      const data = await menuAPI.getCategories(tenantId);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const data = await menuAPI.getMenuItems(tenantId);
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
        const data = await menuAPI.getMenuItems(tenantId);
        setMenuItems(data);
      } else {
        const data = await menuAPI.getMenuItemsByCategory(categoryId, tenantId);
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

  // Function to change language
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="bg-cream-100 min-h-screen pb-16">
      <div className="bg-forest-500 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">{restaurantName}</h1>
        <div className="flex justify-center mt-2 space-x-2">
          <button 
            onClick={() => changeLanguage('en')} 
            className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-lime-500' : 'bg-forest-400'}`}
          >
            English
          </button>
          <button 
            onClick={() => changeLanguage('tr')} 
            className={`px-2 py-1 rounded ${i18n.language === 'tr' ? 'bg-lime-500' : 'bg-forest-400'}`}
          >
            Türkçe
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder={t("menu.search", "Search")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
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
                ? "bg-forest-500 text-white"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
            onClick={() => handleCategoryChange("all")}
          >
            {t("menu.allCategories", "All Categories")}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full mr-2 text-sm font-medium whitespace-nowrap ${
                selectedCategory === category.id
                  ? "bg-forest-500 text-white"
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-500"></div>
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
                        <span className="text-forest-600 font-medium">
                          {formatCurrency(item.price)}
                        </span>
                        {!item.isAvailable && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {t("menu.unavailable", "Unavailable")}
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
            <p className="text-gray-500">{t("menu.noItems", "No items found")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;
