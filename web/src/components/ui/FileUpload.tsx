/**
 * File Upload Component
 * Drag & drop file upload with preview
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import classNames from 'classnames';

interface FileUploadProps {
  label?: string;
  error?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  value?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error,
  accept = 'image/*',
  onChange,
  value,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onChange(file);
    } else {
      setPreview(null);
      onChange(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    handleFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-xl overflow-hidden border-2 border-gray-200"
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <FiX size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={classNames(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
              isDragging
                ? 'border-purple-500 bg-purple-50'
                : error
                ? 'border-red-300 hover:border-red-400'
                : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
            )}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-purple-100 rounded-full">
                {isDragging ? (
                  <FiUpload className="text-purple-600" size={32} />
                ) : (
                  <FiImage className="text-purple-600" size={32} />
                )}
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  Drop your image here, or{' '}
                  <span className="text-purple-600">browse</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          handleFileChange(file);
        }}
        className="hidden"
      />

      {error && (
        <p className="mt-1 text-sm text-red-600 animate-fadeIn">{error}</p>
      )}
    </div>
  );
};
