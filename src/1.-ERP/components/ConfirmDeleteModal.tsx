import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title = 'Eliminar registro' }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-error text-2xl">warning</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600">
            ¿Estás seguro que deseas eliminar este elemento? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-error text-white font-bold rounded-xl hover:bg-error/90 transition-colors shadow-sm"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
