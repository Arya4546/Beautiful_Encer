/**
 * Multi-Select Component
 * Select multiple options with tags
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import classNames from 'classnames';

interface MultiSelectProps {
  label?: string;
  error?: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select options...',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={classNames(
            'w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 cursor-pointer min-h-[48px]',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {value.map((item) => (
                <motion.span
                  key={item}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700"
                >
                  {item}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(item);
                    }}
                    className="ml-2 hover:text-purple-900"
                  >
                    <FiX size={14} />
                  </button>
                </motion.span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            >
              {options.map((option) => (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={classNames(
                    'px-4 py-3 cursor-pointer transition-colors text-gray-900',
                    value.includes(option)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value.includes(option)}
                      onChange={() => {}}
                      className="mr-3 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm">{option}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 animate-fadeIn">{error}</p>
      )}
    </div>
  );
};
