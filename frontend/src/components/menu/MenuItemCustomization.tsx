import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters';

interface MenuItemModifier {
  id: string;
  name: string;
  description?: string;
  type: 'size' | 'extra' | 'option' | 'sauce' | 'cooking_style' | 'temperature';
  priceAdjustment: number;
  isRequired: boolean;
  isAvailable: boolean;
  maxSelections: number;
  minSelections: number;
  options?: string[];
}

interface MenuItemIngredient {
  id: string;
  name: string;
  description?: string;
  isEssential: boolean;
  isAllergen: boolean;
  allergenType?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  allergens?: string[];
  isSpicy: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  modifiers: MenuItemModifier[];
  ingredients: MenuItemIngredient[];
}

interface SelectedModifier {
  modifierId: string;
  selectedOption?: string;
  quantity: number;
}

interface MenuItemCustomizationProps {
  menuItem: MenuItem;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onModifiersChange: (modifiers: SelectedModifier[]) => void;
  onNotesChange: (notes: string) => void;
  onAddToOrder: () => void;
  onClose: () => void;
}

const MenuItemCustomization: React.FC<MenuItemCustomizationProps> = ({
  menuItem,
  quantity,
  onQuantityChange,
  onModifiersChange,
  onNotesChange,
  onAddToOrder,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [totalPrice, setTotalPrice] = useState(menuItem.price);

  useEffect(() => {
    calculateTotalPrice();
  }, [selectedModifiers, quantity]);

  const calculateTotalPrice = () => {
    let modifierTotal = 0;
    selectedModifiers.forEach(selected => {
      const modifier = menuItem.modifiers.find(m => m.id === selected.modifierId);
      if (modifier) {
        modifierTotal += modifier.priceAdjustment * selected.quantity;
      }
    });
    setTotalPrice((menuItem.price + modifierTotal) * quantity);
  };

  const handleModifierChange = (modifier: MenuItemModifier, selectedOption?: string, quantity: number = 1) => {
    setSelectedModifiers(prev => {
      const existing = prev.find(m => m.modifierId === modifier.id);
      
      if (quantity === 0) {
        return prev.filter(m => m.modifierId !== modifier.id);
      }
      
      if (existing) {
        return prev.map(m => 
          m.modifierId === modifier.id 
            ? { ...m, selectedOption, quantity }
            : m
        );
      } else {
        return [...prev, { modifierId: modifier.id, selectedOption, quantity }];
      }
    });
  };

  const getSelectedModifier = (modifierId: string) => {
    return selectedModifiers.find(m => m.modifierId === modifierId);
  };

  const isModifierGroupValid = (modifier: MenuItemModifier) => {
    const selected = getSelectedModifier(modifier.id);
    if (modifier.isRequired && modifier.minSelections > 0) {
      return selected && selected.quantity >= modifier.minSelections;
    }
    return true;
  };

  const canAddToOrder = () => {
    return menuItem.modifiers
      .filter(m => m.isRequired)
      .every(m => isModifierGroupValid(m));
  };

  const handleIngredientToggle = (ingredientId: string) => {
    setRemovedIngredients(prev => 
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const handleAddToOrder = () => {
    onModifiersChange(selectedModifiers);
    onNotesChange(specialNotes);
    onAddToOrder();
  };

  const renderModifierGroup = (modifier: MenuItemModifier) => {
    const selected = getSelectedModifier(modifier.id);
    const isValid = isModifierGroupValid(modifier);

    return (
      <div key={modifier.id} className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <h4 className="font-medium text-gray-900">{modifier.name}</h4>
            {modifier.isRequired && (
              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                {t('menu.required', 'Required')}
              </span>
            )}
            {!isValid && (
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 ml-2" />
            )}
          </div>
          {modifier.priceAdjustment !== 0 && (
            <span className="text-sm font-medium text-gray-600">
              {modifier.priceAdjustment > 0 ? '+' : ''}{formatCurrency(modifier.priceAdjustment)}
            </span>
          )}
        </div>

        {modifier.description && (
          <p className="text-sm text-gray-500 mb-3">{modifier.description}</p>
        )}

        {modifier.type === 'option' && modifier.options ? (
          <div className="space-y-2">
            {modifier.options.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type={modifier.maxSelections === 1 ? 'radio' : 'checkbox'}
                  name={`modifier-${modifier.id}`}
                  checked={selected?.selectedOption === option}
                  onChange={() => handleModifierChange(modifier, option, 1)}
                  className="mr-3"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm">{modifier.name}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleModifierChange(modifier, undefined, Math.max(0, (selected?.quantity || 0) - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                disabled={!selected || selected.quantity <= 0}
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {selected?.quantity || 0}
              </span>
              <button
                onClick={() => handleModifierChange(modifier, undefined, (selected?.quantity || 0) + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                disabled={selected && selected.quantity >= modifier.maxSelections}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('menu.customize', 'Customize')} {menuItem.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4">
            {/* Item Info */}
            <div className="flex items-start space-x-4 mb-6">
              {menuItem.imageUrl && (
                <img
                  src={menuItem.imageUrl}
                  alt={menuItem.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{menuItem.name}</h4>
                {menuItem.description && (
                  <p className="text-sm text-gray-500 mb-2">{menuItem.description}</p>
                )}
                <div className="flex items-center space-x-2 text-xs">
                  {menuItem.isVegetarian && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {t('menu.vegetarian', 'Vegetarian')}
                    </span>
                  )}
                  {menuItem.isVegan && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {t('menu.vegan', 'Vegan')}
                    </span>
                  )}
                  {menuItem.isSpicy && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                      {t('menu.spicy', 'Spicy')}
                    </span>
                  )}
                  {menuItem.isGlutenFree && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {t('menu.glutenFree', 'Gluten Free')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Allergen Warning */}
            {menuItem.allergens && menuItem.allergens.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {t('menu.allergenWarning', 'Allergen Warning')}
                    </p>
                    <p className="text-sm text-yellow-700">
                      {t('menu.contains', 'Contains')}: {menuItem.allergens.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-6">
              <span className="font-medium text-gray-900">{t('menu.quantity', 'Quantity')}</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <MinusIcon className="w-5 h-5" />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => onQuantityChange(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modifiers */}
            {menuItem.modifiers.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  {t('menu.customizations', 'Customizations')}
                </h4>
                {menuItem.modifiers.map(renderModifierGroup)}
              </div>
            )}

            {/* Ingredients */}
            {menuItem.ingredients.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  {t('menu.ingredients', 'Ingredients')}
                </h4>
                <div className="space-y-2">
                  {menuItem.ingredients.map((ingredient) => (
                    <label key={ingredient.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!removedIngredients.includes(ingredient.id)}
                        onChange={() => handleIngredientToggle(ingredient.id)}
                        disabled={ingredient.isEssential}
                        className="mr-3"
                      />
                      <span className={`text-sm ${ingredient.isEssential ? 'text-gray-400' : 'text-gray-700'}`}>
                        {ingredient.name}
                        {ingredient.isAllergen && (
                          <span className="ml-2 text-xs text-red-600">
                            ({ingredient.allergenType})
                          </span>
                        )}
                        {ingredient.isEssential && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({t('menu.essential', 'Essential')})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Special Notes */}
            <div className="mb-6">
              <label className="block font-medium text-gray-900 mb-2">
                {t('menu.specialInstructions', 'Special Instructions')}
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder={t('menu.specialInstructionsPlaceholder', 'Any special requests...')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-gray-900">{t('menu.total', 'Total')}</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          <button
            onClick={handleAddToOrder}
            disabled={!canAddToOrder()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              canAddToOrder()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {t('menu.addToOrder', 'Add to Order')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCustomization;
