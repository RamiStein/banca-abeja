import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Wallet, Users, Sparkles, Tag, FileText, DollarSign, Package } from 'lucide-react';
import { elementsService } from '../services/elementsService';
import { FOUNDING_MEMBERS } from '../services/authService';

const AVAILABLE_WALLET_ICONS = [
  '🐝', '🌱', '💼', '🎪', '🌽', '🚗', 
  '🏡', '🥗', '🛠️', '⚡', '🏥', '📦', 
  '🚲', '🎨', '🥖', '💰'
];

export default function CreateWalletModal({ 
  isOpen, 
  onClose, 
  onCreated, 
  existingElements = [],
  currentUser = null 
}) {
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [isAliasManual, setIsAliasManual] = useState(false);
  const [icon, setIcon] = useState('🐝');
  const [detail, setDetail] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(['ramiro', 'agustina', 'cristian']);
  const [allAvailableMembers, setAllAvailableMembers] = useState(() => {
    return FOUNDING_MEMBERS.map(m => ({ id: m.id, name: m.name, role: m.role }));
  });
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  // Elementos
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const [newElementInputs, setNewElementInputs] = useState([]);
  const [currentNewElemText, setCurrentNewElemText] = useState('');

  // Saldo inicial
  const [initialBalance, setInitialBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setAlias('');
      setIsAliasManual(false);
      setIcon('🐝');
      setDetail('');
      setSelectedMembers(currentUser?.id ? [currentUser.id, 'agustina', 'cristian'] : ['ramiro', 'agustina', 'cristian']);
      setSelectedElementIds([]);
      setNewElementInputs([]);
      setCurrentNewElemText('');
      setInitialBalance('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Auto generar alias cuando cambia el nombre si el usuario no lo editó manualmente
  const handleNameChange = (val) => {
    setName(val);
    if (!isAliasManual) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '.')
        .replace(/\.+/g, '.')
        .replace(/^\.|\.$/g, '')
        .slice(0, 20);
      setAlias(generated);
    }
  };

  const handleToggleMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        if (prev.length <= 1) return prev; // Mantener al menos un integrante
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleAddCustomMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    const newId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!allAvailableMembers.some(m => m.id === newId)) {
      setAllAvailableMembers(prev => [...prev, { id: newId, name: trimmed, role: 'Integrante' }]);
    }
    if (!selectedMembers.includes(newId)) {
      setSelectedMembers(prev => [...prev, newId]);
    }
    setNewMemberName('');
    setShowAddMember(false);
  };

  const handleToggleElement = (elementId) => {
    setSelectedElementIds(prev => {
      if (prev.includes(elementId)) {
        return prev.filter(id => id !== elementId);
      }
      return [...prev, elementId];
    });
  };

  const handleAddNewElementChip = () => {
    const trimmed = currentNewElemText.trim();
    if (!trimmed) return;
    if (!newElementInputs.includes(trimmed)) {
      setNewElementInputs(prev => [...prev, trimmed]);
    }
    setCurrentNewElemText('');
  };

  const handleRemoveNewElementChip = (elemName) => {
    setNewElementInputs(prev => prev.filter(name => name !== elemName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Crear elementos nuevos que se hayan especificado inline
      const createdElementIds = [];
      for (const elemName of newElementInputs) {
        try {
          const created = await elementsService.createElement({
            name: elemName,
            type: selectedMembers.length > 1 ? 'shared' : 'individual',
            creatorId: currentUser?.id || 'ramiro',
            creatorName: currentUser?.name || 'Ramiro',
            icon: '📦',
            category: 'General',
            description: `Elemento creado para la billetera ${name.trim()}`,
            members: selectedMembers,
            initialDeposit: 0
          });
          if (created?.id) {
            createdElementIds.push(created.id);
          }
        } catch (err) {
          console.warn("Error creando elemento inline para billetera:", err);
        }
      }

      const allElementIdsToAssign = [...selectedElementIds, ...createdElementIds];

      // 2. Crear la billetera en elementsService
      const newWallet = await elementsService.createWallet({
        name: name.trim(),
        alias: alias.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
        icon,
        detail: detail.trim(),
        members: selectedMembers,
        elementIds: allElementIdsToAssign,
        initialBalance: parseFloat(initialBalance) || 0
      });

      if (onCreated) {
        onCreated(newWallet);
      }
      onClose();
    } catch (error) {
      console.error("Error al crear billetera:", error);
      alert("Hubo un error al crear la billetera. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto py-6 sm:py-8"
      style={{ overflowY: 'auto' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl relative p-6 sm:p-8 my-auto"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {/* Botón Cerrar (X) con posicionamiento seguro */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all z-10"
          title="Cerrar modal"
        >
          <X size={16} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-sm">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Nueva Billetera</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Multi-Billeteras
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Crea un nuevo espacio económico con sus propios elementos, integrantes y saldo.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre y Alias */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Wallet size={14} className="text-indigo-600" />
                Nombre de la Billetera <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ej: Billetera VRDE, Huerta, Feria..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-600" />
                Alias corto
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs select-none">@</span>
                <input
                  type="text"
                  value={alias}
                  onChange={e => {
                    setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
                    setIsAliasManual(true);
                  }}
                  placeholder="alias"
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Selector de Ícono / Emoji */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Ícono representativo
            </label>
            <div className="flex items-center gap-1.5 flex-wrap p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
              {AVAILABLE_WALLET_ICONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    icon === emoji 
                      ? 'bg-white shadow-md border-2 border-indigo-600 scale-110' 
                      : 'hover:bg-slate-200/70 border border-transparent'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Detalle / Descripción */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-600" />
              Detalle & Propósito de la Billetera
            </label>
            <textarea
              rows={2}
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="Describe el alcance, acuerdos o función económica comunitaria de esta billetera..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Integrantes de la Billetera */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users size={14} className="text-indigo-600" />
                Integrantes de la Billetera ({selectedMembers.length})
              </label>
              <button
                type="button"
                onClick={() => setShowAddMember(!showAddMember)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Otro integrante</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {allAvailableMembers.map(m => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleToggleMember(m.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {isSelected ? <Check size={12} strokeWidth={3} /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Input para agregar integrante personalizado */}
            {showAddMember && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomMember(); } }}
                  placeholder="Nombre del nuevo integrante..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomMember}
                  className="btn btn-sm bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold"
                >
                  Agregar
                </button>
              </div>
            )}
          </div>

          {/* Elementos Asociados */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package size={14} className="text-indigo-600" />
              Elementos & Bolsillos de esta Billetera
            </label>
            <p className="text-[11px] text-slate-500">
              Selecciona elementos existentes que pertenecerán a esta billetera o añade nuevos directamente.
            </p>

            {/* Elementos existentes seleccionables */}
            {existingElements.length > 0 && (
              <div className="overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200/80 pr-1" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                {existingElements.map(elem => {
                  const isChecked = selectedElementIds.includes(elem.id);
                  return (
                    <label
                      key={elem.id}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-bold' 
                          : 'bg-white hover:bg-slate-100/70 border border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleElement(elem.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm">{elem.icon || '📦'}</span>
                        <span>{elem.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {elem.category || 'Elemento'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Agregar elementos nuevos inline */}
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentNewElemText}
                  onChange={e => setCurrentNewElemText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewElementChip(); } }}
                  placeholder="Crear elemento rápido (ej: Insumos de Huerta, Nafta)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddNewElementChip}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-xl font-bold flex items-center gap-1 transition-all"
                >
                  <Plus size={12} />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Chips de nuevos elementos a crear */}
              {newElementInputs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {newElementInputs.map(elemName => (
                    <span 
                      key={elemName}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      <span>✨ {elemName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewElementChip(elemName)}
                        className="text-emerald-600 hover:text-emerald-900 ml-1"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Saldo Inicial Opcional */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-600" />
              Saldo Inicial de la Billetera (ARS)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={initialBalance}
                onChange={e => setInitialBalance(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Monto disponible en la cuenta principal de esta billetera para asignar a sus elementos.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{isSubmitting ? 'Creando Billetera...' : 'Crear Billetera'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
