import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface MessageActionsDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
  isOwn: boolean;
}

export const MessageActionsDropdown: React.FC<MessageActionsDropdownProps> = ({
  onEdit,
  onDelete,
  isOwn,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded transition-colors ${
          isOwn 
            ? 'hover:bg-white/20 text-white/70 hover:text-white' 
            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        }`}
        title="Message options"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            isOwn ? 'right-0' : 'left-0'
          } mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10`}
        >
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
          >
            <Edit2 size={16} />
            <span>Edit message</span>
          </button>
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
          >
            <Trash2 size={16} />
            <span>Delete message</span>
          </button>
        </div>
      )}
    </div>
  );
};
