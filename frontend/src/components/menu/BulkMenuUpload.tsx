import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Select, Textarea } from "../ui";
import { type MenuItem, type Category } from "../../types/menu";
import { useToast } from "../common/ToastProvider";

interface BulkMenuUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (menuItems: MenuItem[]) => void;
  categories: Category[];
  isLoading: boolean;
}

interface BulkMenuItem {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  imageFile?: File;
  imagePreview?: string;
}

const BulkMenuUpload: React.FC<BulkMenuUploadProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { error, success } = useToast();
  const [items, setItems] = useState<BulkMenuItem[]>([
    {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      isAvailable: true,
    },
  ]);

  const addNewItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        isAvailable: true,
      },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof BulkMenuItem, value: any) => {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const handleImageChange = useCallback(
    (index: number, file: File | null) => {
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        error(
          t(
            "menu.invalidImageType",
            "Please upload a valid image file (JPEG, PNG, GIF, WEBP)"
          )
        );
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        error(t("menu.imageTooLarge", "Image size should be less than 2MB"));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        updateItem(index, "imageFile", file);
        updateItem(index, "imagePreview", reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [error, t, updateItem]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate items
      const validItems = items.filter(
        (item) => item.name.trim() && item.price > 0 && item.categoryId
      );

      if (validItems.length === 0) {
        error(t("menu.noValidItems", "Please add at least one valid item"));
        return;
      }

      // Convert to MenuItem format
      const menuItems: MenuItem[] = validItems.map((item, index) => ({
        id: `bulk-${Date.now()}-${index}`,
        name: item.name.trim(),
        description: item.description.trim(),
        price: item.price,
        categoryId: item.categoryId,
        isAvailable: item.isAvailable,
        imageFile: item.imageFile,
      }));

      onSave(menuItems);
    },
    [items, error, t, onSave]
  );

  const downloadTemplate = useCallback(() => {
    const headers = [
      "name",
      "description",
      "price",
      "categoryId",
      "isAvailable",
    ];
    const sampleData = [
      [
        "Pizza Margherita",
        "Classic pizza with tomato sauce, mozzarella and basil",
        "12.99",
        categories[0]?.id || "category-1",
        "true",
      ],
      [
        "Caesar Salad",
        "Fresh romaine lettuce with caesar dressing and croutons",
        "8.50",
        categories[0]?.id || "category-1",
        "true",
      ],
      [
        "Grilled Chicken",
        "Tender grilled chicken breast with herbs",
        "15.99",
        categories[0]?.id || "category-1",
        "false",
      ],
    ];

    const csvContent = [headers, ...sampleData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "menu_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success(
      t("menu.templateDownloaded", "Template CSV downloaded successfully")
    );
  }, [categories, success, t]);

  const handleCSVUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const csv = event.target?.result as string;
        const lines = csv.split("\n");
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));

        const csvItems: BulkMenuItem[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          if (values.length >= 4) {
            csvItems.push({
              name: values[0] || "",
              description: values[1] || "",
              price: parseFloat(values[2]) || 0,
              categoryId: values[3] || "",
              isAvailable: values[4]?.toLowerCase() !== "false",
            });
          }
        }

        if (csvItems.length > 0) {
          setItems(csvItems);
          success(
            t("menu.csvImported", `Imported ${csvItems.length} items from CSV`)
          );
        } else {
          error(t("menu.csvImportError", "No valid items found in CSV file"));
        }
      };
      reader.readAsText(file);
    },
    [success, error, t]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-100 dark:bg-darkGray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-soft">
        <div className="flex justify-between items-center p-6 border-b border-neutral-300 dark:border-darkGray-700">
          <h2 className="text-xl font-bold text-primary-900 dark:text-neutral-100">
            {t("menu.bulkUpload", "Bulk Menu Upload")}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={addNewItem}
                leftIcon={<PlusIcon className="h-4 w-4" />}
              >
                {t("menu.addItem", "Add Item")}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
              >
                {t("menu.downloadTemplate", "Download Template")}
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="sr-only"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center px-4 py-2 border border-neutral-300 dark:border-darkGray-600 rounded-xl shadow-sm text-sm font-medium text-primary-700 dark:text-neutral-300 bg-neutral-100 dark:bg-darkGray-700 hover:bg-neutral-200 dark:hover:bg-darkGray-600 cursor-pointer transition-colors"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                  {t("menu.importCSV", "Import CSV")}
                </label>
              </div>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
              <h4 className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-2">
                {t("menu.csvInstructions", "CSV Import Instructions")}
              </h4>
              <ul className="text-xs text-primary-700 dark:text-primary-300 space-y-1">
                <li>
                  •{" "}
                  {t(
                    "menu.csvInstruction1",
                    "Download the template to see the correct format"
                  )}
                </li>
                <li>
                  •{" "}
                  {t(
                    "menu.csvInstruction2",
                    "Fill in your menu items with: name, description, price, categoryId, isAvailable"
                  )}
                </li>
                <li>
                  •{" "}
                  {t(
                    "menu.csvInstruction3",
                    "Use category IDs from your existing categories"
                  )}
                </li>
                <li>
                  •{" "}
                  {t(
                    "menu.csvInstruction4",
                    "Set isAvailable to 'true' or 'false'"
                  )}
                </li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-darkGray-700 rounded-xl p-6 border border-neutral-200 dark:border-darkGray-600"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-primary-900 dark:text-neutral-100">
                      {t("menu.item", "Item")} {index + 1}
                    </h3>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-danger-500 hover:text-danger-700 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                      label={t("menu.name", "Name")}
                      value={item.name}
                      onChange={(e) =>
                        updateItem(index, "name", e.target.value)
                      }
                      placeholder={t("menu.namePlaceholder", "Enter item name")}
                      required
                      fullWidth
                    />

                    <Input
                      type="number"
                      label={t("menu.price", "Price")}
                      value={item.price}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder={t("menu.pricePlaceholder", "Enter price")}
                      min="0"
                      step="0.01"
                      required
                      fullWidth
                    />

                    <Select
                      label={t("menu.category", "Category")}
                      value={item.categoryId}
                      onChange={(e) =>
                        updateItem(index, "categoryId", e.target.value)
                      }
                      placeholder={t(
                        "menu.selectCategory",
                        "Select a category"
                      )}
                      required
                      fullWidth
                      options={[
                        {
                          value: "",
                          label: t("menu.selectCategory", "Select a category"),
                          disabled: true,
                        },
                        ...categories.map((category) => ({
                          value: category.id,
                          label: category.name,
                        })),
                      ]}
                    />

                    <div className="md:col-span-2">
                      <Textarea
                        label={t("menu.description", "Description")}
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder={t(
                          "menu.descriptionPlaceholder",
                          "Enter item description"
                        )}
                        rows={2}
                        fullWidth
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-primary-700 dark:text-neutral-300 mb-2">
                        {t("menu.image", "Image")}
                      </label>
                      <div className="flex-1 border-2 border-dashed border-neutral-300 dark:border-darkGray-600 rounded-xl p-4 text-center">
                        {item.imagePreview ? (
                          <div className="relative">
                            <img
                              src={item.imagePreview}
                              alt={item.name}
                              className="h-20 w-20 object-cover rounded-lg mx-auto"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateItem(index, "imageFile", undefined);
                                updateItem(index, "imagePreview", undefined);
                              }}
                              className="absolute -top-1 -right-1 bg-danger-500 hover:bg-danger-600 text-white rounded-full p-1 text-xs"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <PhotoIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                              {t("menu.uploadImage", "Upload")}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) =>
                                handleImageChange(
                                  index,
                                  e.target.files?.[0] || null
                                )
                              }
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      id={`available-${index}`}
                      checked={item.isAvailable}
                      onChange={(e) =>
                        updateItem(index, "isAvailable", e.target.checked)
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-darkGray-600 rounded"
                    />
                    <label
                      htmlFor={`available-${index}`}
                      className="ml-2 text-sm font-medium text-primary-700 dark:text-neutral-300 cursor-pointer"
                    >
                      {t("menu.available", "Available")}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-neutral-300 dark:border-darkGray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                isLoading={isLoading}
              >
                {t(
                  "menu.createItems",
                  `Create ${
                    items.filter((item) => item.name.trim()).length
                  } Items`
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkMenuUpload;
