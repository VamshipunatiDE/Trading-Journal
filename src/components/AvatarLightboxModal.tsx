import React from 'react';
import { X, User } from 'lucide-react';

interface AvatarLightboxModalProps {
  isOpen: boolean;
  photoUrl?: string;
  name: string;
  onClose: () => void;
  onUploadClick?: () => void;
}

export const AvatarLightboxModal: React.FC<AvatarLightboxModalProps> = ({
  isOpen,
  photoUrl,
  name,
  onClose,
  onUploadClick
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-[#12161E] border border-gray-800 rounded-3xl p-6 flex flex-col items-center max-w-[560px] w-full shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-900/80 text-gray-300 hover:text-white hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-full overflow-hidden border-4 border-[#3ED9B8] shadow-2xl bg-gray-900 flex items-center justify-center my-4">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <User className="w-32 h-32" />
              <span className="mt-2 text-2xl font-semibold text-gray-300 font-display">
                {name ? name.substring(0, 2).toUpperCase() : 'TJ'}
              </span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-display font-semibold text-white mt-2">{name || 'Trader Profile'}</h3>
        <p className="text-sm text-gray-400 mt-1">Trading Journal Account</p>

        {onUploadClick && (
          <button
            onClick={() => {
              onClose();
              onUploadClick();
            }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-[#191F2A] hover:bg-[#222a38] text-[#3ED9B8] font-medium text-sm border border-gray-800 transition"
          >
            Change Profile Photo
          </button>
        )}
      </div>
    </div>
  );
};
