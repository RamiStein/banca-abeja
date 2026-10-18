// Servicio de Gestión de Elementos y Multi-Billeteras (Banca Abeja)
// Maneja la persistencia de Billeteras (Elementales, VRDE, etc.),
// Elementos (Individuales, Bilaterales y Compartidos),
// sus flujos económicos (Ingresos, Egresos, Depósitos, Retiros) y la cuenta principal.

import { db } from '../firebase';
import { 
  collection, doc, getDoc, setDoc, addDoc, updateDoc, 
  deleteDoc, onSnapshot, query, orderBy, where, getDocs 
} from 'firebase/firestore';

const STORAGE_ELEMENTS_KEY = 'banca_abeja_elements_v2';
const STORAGE_ACCOUNT_KEY = 'banca_abeja_main_accounts_v2';
const STORAGE_ELEMENT_TXS_KEY = 'banca_abeja_element_transactions_v2';
const STORAGE_WALLETS_KEY = 'banca_abeja_wallets_v2';
const STORAGE_ACTIVE_WALLET_KEY = 'banca_abeja_active_wallet_id_v2';
const STORAGE_MILESTONES_KEY = 'banca_abeja_milestones_v2';

// Billeteras iniciales demostrativas del sistema Multi-Billeteras Inteligentes con Reglas
export const DEFAULT_WALLETS = [
  {
    id: 'wallet-elementales',
    name: 'Elementales',
    alias: 'abeja.elementales',
    icon: '🐝',
    detail: 'Billetera comunitaria principal para compras elementales, víveres, hábitat y fondo común.',
    members: ['ramiro', 'agustina', 'cristian'],
    elementIds: ['elem-clio', 'elem-comida', 'elem-habitat', 'elem-mano-mano-cris', 'elem-feria'],
    balance: 450000,
    currency: 'ARS',
    rules: {
      contributionModel: 'equal', // 'equal' | 'proportional' | 'voluntary'
      expenseApprovalThreshold: 30000, // Gastos mayores requieren acuerdo grupal
      reservePercentage: 10, // 10% del fondo queda como resguardo
      defaultExpenseElementId: 'elem-comida',
      agreementSummary: 'Compras cotidianas libres hasta $30.000. Gastos mayores se consultan por WhatsApp.'
    },
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'wallet-vrde',
    name: 'VRDE',
    alias: 'abeja.vrde',
    icon: '🌱',
    detail: 'Proyectos de huerta agroecológica, producción de bioinsumos y economía circular.',
    members: ['ramiro', 'agustina'],
    elementIds: ['elem-huerta', 'elem-compost'],
    balance: 180000,
    currency: 'ARS',
    rules: {
      contributionModel: 'proportional',
      expenseApprovalThreshold: 25000,
      reservePercentage: 15,
      agreementSummary: 'Fondo rotatorio de bioinsumos y reinversión del 15% de ventas.'
    },
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'wallet-feria',
    name: 'Equipo Feria',
    alias: 'abeja.feria',
    icon: '🎪',
    detail: 'Coordinación económica exclusiva del equipo de feria, inscripciones y logística de puestos.',
    members: ['ramiro', 'cristian'],
    elementIds: ['elem-feria'],
    balance: 60000,
    currency: 'ARS',
    rules: {
      contributionModel: 'voluntary',
      expenseApprovalThreshold: 20000,
      reservePercentage: 15,
      agreementSummary: 'Fondo de caja para montaje de puestos y compras de insumos para la feria.'
    },
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: 'wallet-personal-ramiro',
    name: 'Personal Ramiro',
    alias: 'ramiro.personal',
    icon: '💼',
    detail: 'Caja y gastos individuales de Ramiro.',
    members: ['ramiro'],
    elementIds: ['elem-personal-ramiro'],
    balance: 95000,
    currency: 'ARS',
    rules: {
      contributionModel: 'voluntary',
      expenseApprovalThreshold: 100000,
      reservePercentage: 0,
      agreementSummary: 'Caja individual y gastos propios sin rendición grupal.'
    },
    createdAt: Date.now() - 86400000 * 2
  }
];

// Hitos demostrativos con temporalidad y micro-contabilidad
export const DEFAULT_MILESTONES = [
  {
    id: 'milestone-feria-primavera',
    elementId: 'elem-feria',
    name: 'Edición Primavera (18 de Octubre)',
    startDate: '17/10/2026',
    endDate: null,
    status: 'open', // 'open' | 'closed'
    initialSeedFund: 30000,
    goalDescription: 'Puestos de feria, arepas comunitarias, maíz y frutos secos.',
    netResult: null,
    createdAt: Date.now() - 86400000
  }
];

// Semillas iniciales demostrativas de Elementos (Clio, Comida, Huerta, etc.)
export const DEFAULT_ELEMENTS = [
  {
    id: 'elem-clio',
    name: 'Clio',
    type: 'shared', // 'shared' | 'individual' | 'bilateral'
    creatorId: 'ramiro',
    creatorName: 'Ramiro',
    icon: '🚗',
    category: 'Movilidad',
    description: 'Gestión de combustible, service y uso compartido del Renault Clio.',
    members: ['ramiro', 'agustina', 'cristian'],
    initialBalance: 0,
    currency: 'ARS',
    walletId: 'wallet-elementales',
    costBase: [
      { id: 'cost-clio-1', name: 'Nafta Súper YPF', unitCost: 1100, unit: 'litro', category: 'Combustible' },
      { id: 'cost-clio-2', name: 'Nafta Infinia YPF', unitCost: 1350, unit: 'litro', category: 'Combustible' }
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'elem-comida',
    name: 'Comida & Despensa',
    type: 'shared',
    creatorId: 'ramiro',
    creatorName: 'Ramiro',
    icon: '🥗',
    category: 'Alimentos',
    description: 'Compras comunitarias de verdulería, despensa y elaboración de viandas.',
    members: ['ramiro', 'agustina'],
    initialBalance: 0,
    currency: 'ARS',
    walletId: 'wallet-elementales',
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: 'elem-habitat',
    name: 'Hábitat & Mantenimiento',
    type: 'shared',
    creatorId: 'ramiro',
    creatorName: 'Ramiro',
    icon: '🏡',
    category: 'Hábitat',
    description: 'Mantenimiento del predio, herramientas y compras de ferretería.',
    members: ['ramiro', 'agustina', 'cristian'],
    initialBalance: 0,
    currency: 'ARS',
    walletId: 'wallet-elementales',
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'elem-personal-ramiro',
    name: 'Gastos Personales Ramiro',
    type: 'individual',
    creatorId: 'ramiro',
    creatorName: 'Ramiro',
    icon: '💼',
    category: 'Personal',
    description: 'Bolsillo individual para gastos propios y caja personal.',
    members: ['ramiro'],
    initialBalance: 0,
    currency: 'ARS',
    walletId: 'wallet-personal-ramiro',
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'elem-mano-mano-cris',
    name: 'Mano a Mano con Cris',
    type: 'bilateral',
    creatorId: 'ramiro',
    creatorName: 'Ramiro',
    icon: '🤝',
    category: 'Intercambios',
    description: 'Intercambios directos, adelantos y compras bilaterales entre Cris y Ramiro.',
    members: ['ramiro', 'cristian'],
    initialBalance: 0,
    currency: 'ARS',
    walletId: 'wallet-elementales',
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: 'elem-feria',
    name: 'Feria Comunitaria',
    type: 'shared',
    creatorId: 'ramiro',
    creatorName: 'Ramiro',
    icon: '🎪',
    category: 'Feria',
    description: 'Fondo de inversión, insumos de producción y ventas de la feria colectiva.',
    members: ['ramiro', 'cristian', 'agustina'],
    initialBalance: 0,
    currency: 'ARS',
    walletId: 'wallet-elementales',
    walletIds: ['wallet-elementales', 'wallet-feria'], // Co-creado por ambas billeteras
    costBase: [
      { id: 'cost-feria-1', name: 'Maíz partido blanco', unitCost: 3000, unit: 'kg', category: 'Insumos Arepas' },
      { id: 'cost-feria-2', name: 'Maíz partido amarillo', unitCost: 2000, unit: 'kg', category: 'Insumos Arepas' },
      { id: 'cost-feria-3', name: 'Frutos secos agroecológicos', unitCost: 4500, unit: '100gr', category: 'Despensa' }
    ],
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'elem-huerta',
    name: 'Huerta Agroecológica',
    type: 'shared',
    creatorId: 'ramiro',
    creatorName: 'Ramiro',
    icon: '🌱',
    category: 'Hábitat',
    description: 'Insumos de siembra, semillas agroecológicas y riego.',
    members: ['ramiro', 'agustina'],
    initialBalance: 0,
    currency: 'ARS',
    walletId: 'wallet-vrde',
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'elem-compost',
    name: 'Bioinsumos & Compost',
    type: 'shared',
    creatorId: 'agustina',
    creatorName: 'Agustina',
    icon: '🌿',
    category: 'Herramientas',
    description: 'Preparación de biopreparados, compostaje y lombricultura.',
    members: ['ramiro', 'agustina'],
    initialBalance: 0,
    currency: 'ARS',
    walletId: 'wallet-vrde',
    createdAt: Date.now() - 86400000 * 1
  }
];

// Movimientos iniciales de prueba para Clio, Comida, Huerta, etc.
export const DEFAULT_ELEMENT_TXS = [
  {
    id: 'etx-1',
    elementId: 'elem-clio',
    type: 'deposit', // 'deposit' | 'withdraw' | 'income' | 'expense'
    amount: 50000,
    concept: 'Aporte inicial para combustible y repuestos',
    memberId: 'ramiro',
    memberName: 'Ramiro',
    currency: 'ARS',
    timestamp: Date.now() - 86400000 * 4,
    date: new Date(Date.now() - 86400000 * 4).toLocaleDateString('es-AR')
  },
  {
    id: 'etx-2',
    elementId: 'elem-clio',
    type: 'deposit',
    amount: 30000,
    concept: 'Depósito de combustible compartido',
    memberId: 'agustina',
    memberName: 'Agustina',
    currency: 'ARS',
    timestamp: Date.now() - 86400000 * 3,
    date: new Date(Date.now() - 86400000 * 3).toLocaleDateString('es-AR')
  },
  {
    id: 'etx-maiz-1',
    elementId: 'elem-mano-mano-cris',
    type: 'expense',
    amount: 5000,
    concept: 'Maíz partido ($3.000 blanco + $2.000 amarillo) a pedido de Cris',
    memberId: 'ramiro',
    memberName: 'Ramiro',
    targetMemberId: 'cristian',
    linkedElementId: 'elem-feria',
    linkedElementName: 'Feria Comunitaria',
    milestoneId: 'milestone-feria-primavera',
    currency: 'ARS',
    timestamp: Date.now() - 3600000,
    date: new Date().toLocaleDateString('es-AR')
  },
  {
    id: 'etx-3',
    elementId: 'elem-clio',
    type: 'expense',
    amount: 25000,
    concept: 'Carga de nafta YPF Infinia para viaje',
    memberId: 'ramiro',
    memberName: 'Ramiro',
    currency: 'ARS',
    timestamp: Date.now() - 86400000 * 2,
    date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('es-AR')
  },
  {
    id: 'etx-4',
    elementId: 'elem-comida',
    type: 'income',
    amount: 45000,
    concept: 'Ingreso por venta de viandas y canastas',
    memberId: 'ramiro',
    memberName: 'Ramiro',
    currency: 'ARS',
    timestamp: Date.now() - 86400000 * 3,
    date: new Date(Date.now() - 86400000 * 3).toLocaleDateString('es-AR')
  },
  {
    id: 'etx-5',
    elementId: 'elem-comida',
    type: 'expense',
    amount: 28000,
    concept: 'Compra de verdulería agroecológica y despensa',
    memberId: 'agustina',
    memberName: 'Agustina',
    currency: 'ARS',
    timestamp: Date.now() - 86400000 * 1,
    date: new Date(Date.now() - 86400000 * 1).toLocaleDateString('es-AR')
  },
  {
    id: 'etx-vrde-1',
    elementId: 'elem-huerta',
    type: 'deposit',
    amount: 35000,
    concept: 'Fondo semilla para plantines y semillas agroecológicas',
    memberId: 'ramiro',
    memberName: 'Ramiro',
    currency: 'ARS',
    timestamp: Date.now() - 86400000 * 2,
    date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('es-AR')
  },
  {
    id: 'etx-vrde-2',
    elementId: 'elem-compost',
    type: 'income',
    amount: 22000,
    concept: 'Venta de humus de lombriz y bokashi a miembros',
    memberId: 'agustina',
    memberName: 'Agustina',
    currency: 'ARS',
    timestamp: Date.now() - 86400000 * 1,
    date: new Date(Date.now() - 86400000 * 1).toLocaleDateString('es-AR')
  }
];

class ElementsService {
  constructor() {
    this.wallets = this.loadStoredWallets();
    this.activeWalletId = this.loadActiveWalletId();
    this.elements = this.loadStoredElements();
    this.transactions = this.loadStoredTransactions();
    this.accounts = this.loadStoredAccounts();
    this.milestones = this.loadStoredMilestones();
  }

  // --- PERSISTENCIA LOCAL ULTRA RESILIENTE ---
  loadStoredWallets() {
    try {
      const saved = localStorage.getItem(STORAGE_WALLETS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(w => w.id));
          const missingDefaults = DEFAULT_WALLETS.filter(d => !existingIds.has(d.id));
          let combined = missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;

          // Normalizar y asegurar alias únicos para cada billetera
          let changed = missingDefaults.length > 0;
          combined = combined.map(w => {
            let alias = w.alias;
            if (!alias) {
              if (w.id === 'wallet-elementales') alias = 'abeja.elementales';
              else if (w.id === 'wallet-vrde') alias = 'abeja.vrde';
              else if (w.id === 'wallet-feria') alias = 'abeja.feria';
              else if (w.id === 'wallet-personal-ramiro') alias = 'ramiro.personal';
              else alias = `abeja.${w.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
              changed = true;
            } else if (alias === 'elementales') {
              alias = 'abeja.elementales';
              changed = true;
            } else if (alias === 'vrde') {
              alias = 'abeja.vrde';
              changed = true;
            } else if (alias === 'feria') {
              alias = 'abeja.feria';
              changed = true;
            }
            return { ...w, alias };
          });

          if (changed) {
            localStorage.setItem(STORAGE_WALLETS_KEY, JSON.stringify(combined));
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn("Error leyendo billeteras locales:", e);
    }
    return DEFAULT_WALLETS;
  }

  saveStoredWallets(wallets) {
    this.wallets = Array.isArray(wallets) ? wallets : DEFAULT_WALLETS;
    try {
      localStorage.setItem(STORAGE_WALLETS_KEY, JSON.stringify(this.wallets));
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('banca_wallets_updated', { detail: { wallets: this.wallets } }));
    } catch (e) {}
  }

  loadActiveWalletId() {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_WALLET_KEY);
      if (saved && (this.wallets || []).some(w => w.id === saved)) {
        return saved;
      }
    } catch (e) {}
    return this.wallets?.[0]?.id || 'wallet-elementales';
  }

  setActiveWalletId(walletId) {
    if (!walletId) return;
    this.activeWalletId = walletId;
    try {
      localStorage.setItem(STORAGE_ACTIVE_WALLET_KEY, walletId);
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('banca_wallet_changed', { detail: { walletId } }));
    } catch (e) {}
  }

  getActiveWalletId() {
    if (!this.activeWalletId || !(this.wallets || []).some(w => w.id === this.activeWalletId)) {
      this.activeWalletId = this.wallets?.[0]?.id || 'wallet-elementales';
    }
    return this.activeWalletId;
  }

  getActiveWallet() {
    const id = this.getActiveWalletId();
    return (this.wallets || []).find(w => w.id === id) || this.wallets?.[0] || DEFAULT_WALLETS[0];
  }

  getWallets() {
    return [...(this.wallets || DEFAULT_WALLETS)];
  }

  getWalletById(walletId) {
    return (this.wallets || []).find(w => w.id === walletId) || null;
  }

  getWalletByAlias(aliasQuery) {
    if (!aliasQuery || typeof aliasQuery !== 'string') return null;
    const clean = aliasQuery.trim().toLowerCase().replace(/^@+/, '');
    if (!clean) return null;
    return (this.wallets || []).find(w => {
      const wAlias = String(w.alias || '').trim().toLowerCase().replace(/^@+/, '');
      const wId = String(w.id || '').trim().toLowerCase();
      const wName = String(w.name || '').trim().toLowerCase();
      return wAlias === clean || 
             wAlias === `abeja.${clean}` || 
             clean === `abeja.${wAlias}` || 
             wId === clean || 
             wName === clean;
    }) || null;
  }

  loadStoredElements() {
    try {
      const saved = localStorage.getItem(STORAGE_ELEMENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Asegurar que cada elemento tenga un walletId asignado
          const validated = parsed.map(elem => {
            if (!elem.walletId) {
              if (elem.id === 'elem-personal-ramiro') return { ...elem, walletId: 'wallet-personal-ramiro' };
              if (elem.id === 'elem-huerta' || elem.id === 'elem-compost') return { ...elem, walletId: 'wallet-vrde' };
              return { ...elem, walletId: 'wallet-elementales' };
            }
            return elem;
          });

          const existingIds = new Set(validated.map(e => e.id));
          const missingDefaults = DEFAULT_ELEMENTS.filter(d => !existingIds.has(d.id));
          if (missingDefaults.length > 0) {
            const combined = [...validated, ...missingDefaults];
            localStorage.setItem(STORAGE_ELEMENTS_KEY, JSON.stringify(combined));
            return combined;
          }
          return validated;
        }
      }
    } catch (e) {
      console.warn("Error leyendo elementos locales:", e);
    }
    return DEFAULT_ELEMENTS;
  }

  saveStoredElements(elements) {
    this.elements = Array.isArray(elements) ? elements : DEFAULT_ELEMENTS;
    try {
      localStorage.setItem(STORAGE_ELEMENTS_KEY, JSON.stringify(this.elements));
    } catch (e) {}
  }

  loadStoredTransactions() {
    try {
      const saved = localStorage.getItem(STORAGE_ELEMENT_TXS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(t => t.id));
          const missingDefaults = DEFAULT_ELEMENT_TXS.filter(d => !existingIds.has(d.id));
          if (missingDefaults.length > 0) {
            const combined = [...missingDefaults, ...parsed];
            localStorage.setItem(STORAGE_ELEMENT_TXS_KEY, JSON.stringify(combined));
            return combined;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error leyendo transacciones de elementos:", e);
    }
    return DEFAULT_ELEMENT_TXS;
  }

  saveStoredTransactions(txs) {
    this.transactions = Array.isArray(txs) ? txs : DEFAULT_ELEMENT_TXS;
    try {
      localStorage.setItem(STORAGE_ELEMENT_TXS_KEY, JSON.stringify(this.transactions));
    } catch (e) {}
  }

  loadStoredAccounts() {
    const defaults = {
      ramiro: { balance: 450000, updatedAt: Date.now() },
      agustina: { balance: 280000, updatedAt: Date.now() },
      cristian: { balance: 220000, updatedAt: Date.now() }
    };
    try {
      const saved = localStorage.getItem(STORAGE_ACCOUNT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...defaults, ...parsed };
      }
    } catch (e) {}
    return defaults;
  }

  saveStoredAccounts(accounts) {
    this.accounts = (accounts && typeof accounts === 'object') ? accounts : this.loadStoredAccounts();
    try {
      localStorage.setItem(STORAGE_ACCOUNT_KEY, JSON.stringify(this.accounts));
    } catch (e) {}
  }

  loadStoredMilestones() {
    try {
      const saved = localStorage.getItem(STORAGE_MILESTONES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(m => m.id));
          const missingDefaults = DEFAULT_MILESTONES.filter(d => !existingIds.has(d.id));
          if (missingDefaults.length > 0) {
            const combined = [...parsed, ...missingDefaults];
            localStorage.setItem(STORAGE_MILESTONES_KEY, JSON.stringify(combined));
            return combined;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error leyendo hitos locales:", e);
    }
    return DEFAULT_MILESTONES;
  }

  saveStoredMilestones(milestones) {
    this.milestones = Array.isArray(milestones) ? milestones : DEFAULT_MILESTONES;
    try {
      localStorage.setItem(STORAGE_MILESTONES_KEY, JSON.stringify(this.milestones));
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('banca_milestones_updated', { detail: { milestones: this.milestones } }));
    } catch (e) {}
  }

  // --- CUENTA PRINCIPAL / SALDOS ---
  getMainBalance(userId = 'ramiro') {
    if (!this.accounts || typeof this.accounts !== 'object') {
      this.accounts = this.loadStoredAccounts();
    }
    const cleanId = String(userId || 'ramiro').toLowerCase();
    const acc = this.accounts[cleanId];
    if (acc && typeof acc.balance === 'number' && !isNaN(acc.balance)) return acc.balance;
    return 450000;
  }

  async updateMainBalance(userId, amountToAdd) {
    const current = this.getMainBalance(userId);
    const newBal = current + amountToAdd;
    const updated = {
      ...this.accounts,
      [userId]: { balance: newBal, updatedAt: Date.now() }
    };
    this.saveStoredAccounts(updated);

    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_accounts', userId), {
          balance: newBal,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore error al guardar balance de cuenta:", e);
      }
    }
    return newBal;
  }

  // --- MÉTODOS DE BILLETERAS ---
  getWalletBalance(walletId) {
    const targetId = walletId || this.getActiveWalletId();
    const wallet = this.getWalletById(targetId);
    if (wallet && typeof wallet.balance === 'number' && !isNaN(wallet.balance)) {
      return wallet.balance;
    }
    return this.getMainBalance('ramiro');
  }

  async updateWalletBalance(walletId, delta) {
    const targetId = walletId || this.getActiveWalletId();
    const wallet = this.getWalletById(targetId);
    if (!wallet) return this.updateMainBalance('ramiro', delta);

    const currentBal = Number(wallet.balance) || 0;
    const newBal = currentBal + Number(delta);
    await this.updateWallet(targetId, { balance: newBal });
    return newBal;
  }

  async createWallet({
    name,
    alias = '',
    icon = '🐝',
    detail = '',
    members = ['ramiro'],
    elementIds = [],
    initialBalance = 0,
    currency = 'ARS'
  }) {
    const slug = (alias || name).toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
    const newId = `wallet-${slug}-${Date.now().toString(36)}`;
    const numInitial = Math.max(0, parseFloat(initialBalance) || 0);

    const newWallet = {
      id: newId,
      name: name.trim(),
      alias: (alias || slug).trim().replace(/^@+/, ''),
      icon: icon || '🐝',
      detail: (detail || '').trim(),
      members: Array.isArray(members) && members.length > 0 ? members : ['ramiro'],
      elementIds: Array.isArray(elementIds) ? elementIds : [],
      balance: numInitial,
      currency,
      createdAt: Date.now()
    };

    const updatedWallets = [...this.wallets, newWallet];
    this.saveStoredWallets(updatedWallets);

    // Asignar los elementos seleccionados a esta nueva billetera
    if (Array.isArray(elementIds) && elementIds.length > 0) {
      const updatedElements = this.elements.map(el => {
        if (elementIds.includes(el.id)) {
          return { ...el, walletId: newId };
        }
        return el;
      });
      this.saveStoredElements(updatedElements);
    }

    // Establecer automáticamente como activa
    this.setActiveWalletId(newId);

    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_wallets', newId), newWallet);
      } catch (e) {
        console.warn("Firestore error al guardar billetera:", e);
      }
    }

    return newWallet;
  }

  async updateWallet(walletId, updates) {
    const updated = this.wallets.map(w => {
      if (w.id === walletId) {
        return { ...w, ...updates, updatedAt: Date.now() };
      }
      return w;
    });
    this.saveStoredWallets(updated);

    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_wallets', walletId), updates, { merge: true });
      } catch (e) {
        console.warn("Firestore error al actualizar billetera:", e);
      }
    }
  }

  async deleteWallet(walletId) {
    // Si quedan elementos en esta billetera, reasignarlos a la billetera principal
    const fallbackWalletId = this.wallets.find(w => w.id !== walletId)?.id || 'wallet-elementales';
    const updatedElements = this.elements.map(el => {
      if (el.walletId === walletId) {
        return { ...el, walletId: fallbackWalletId };
      }
      return el;
    });
    this.saveStoredElements(updatedElements);

    // Filtrar billetera
    const updatedWallets = this.wallets.filter(w => w.id !== walletId);
    this.saveStoredWallets(updatedWallets.length > 0 ? updatedWallets : DEFAULT_WALLETS);

    // Si la billetera eliminada era la activa, cambiar a fallback
    if (this.activeWalletId === walletId) {
      this.setActiveWalletId(fallbackWalletId);
    }

    if (db) {
      try {
        await deleteDoc(doc(db, 'banca_abeja_wallets', walletId));
      } catch (e) {
        console.warn("Firestore error al eliminar billetera:", e);
      }
    }
  }

  async updateWalletRules(walletId, rules) {
    const target = this.getWalletById(walletId);
    if (!target) return null;
    const mergedRules = { ...(target.rules || {}), ...rules };
    await this.updateWallet(walletId, { rules: mergedRules });
    return mergedRules;
  }

  // --- TRANSFERENCIAS ENTRE BILLETERAS (FLUJO ESTILO MERCADO PAGO) ---
  async transferBetweenWallets({
    sourceWalletId,
    destinationWalletId,
    amount,
    concept = '',
    memberId = 'ramiro',
    memberName = 'Ramiro'
  }) {
    const numAmount = Math.max(0, parseFloat(amount) || 0);
    if (numAmount <= 0) {
      throw new Error('El monto de la transferencia debe ser mayor a cero.');
    }

    if (!sourceWalletId || !destinationWalletId) {
      throw new Error('Debes seleccionar tanto la billetera de origen como la de destino.');
    }

    if (sourceWalletId === destinationWalletId) {
      throw new Error('La billetera de origen y la de destino no pueden ser la misma.');
    }

    const sourceWallet = this.getWalletById(sourceWalletId);
    const destWallet = this.getWalletById(destinationWalletId);

    if (!sourceWallet) throw new Error('Billetera de origen no encontrada.');
    if (!destWallet) throw new Error('Billetera de destino no encontrada.');

    const sourceBalance = Number(sourceWallet.balance) || 0;
    if (sourceBalance < numAmount) {
      throw new Error(`Saldo insuficiente en ${sourceWallet.name}. Disponible: $${sourceBalance.toLocaleString('es-AR')}`);
    }

    // Código de operación estilo Mercado Pago (#1048291048)
    const operationNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const referenceCode = `MP-${operationNumber}`;
    const transferConcept = (concept || `Transferencia a ${destWallet.name}`).trim();
    const timestamp = Date.now();
    const dateStr = new Date().toLocaleDateString('es-AR');

    // 1. Debitar en billetera origen
    const newSourceBal = await this.updateWalletBalance(sourceWalletId, -numAmount);

    // 2. Acreditar en billetera destino
    const newDestBal = await this.updateWalletBalance(destinationWalletId, numAmount);

    // 3. Registrar egreso por transferencia en origen
    const txOut = {
      id: `tx-tf-out-${timestamp}-${Math.random().toString(36).substr(2, 4)}`,
      elementId: null,
      walletId: sourceWallet.id,
      walletName: sourceWallet.name,
      amount: numAmount,
      type: 'transfer_out',
      concept: `Envío a @${destWallet.alias || destWallet.name}: ${transferConcept}`,
      memberId: memberId || 'ramiro',
      memberName: memberName || 'Ramiro',
      date: dateStr,
      timestamp: timestamp,
      transferDetails: {
        operationNumber,
        referenceCode,
        sourceWalletId: sourceWallet.id,
        sourceWalletName: sourceWallet.name,
        sourceWalletAlias: sourceWallet.alias,
        destWalletId: destWallet.id,
        destWalletName: destWallet.name,
        destWalletAlias: destWallet.alias,
        direction: 'out'
      }
    };

    // 4. Registrar ingreso por transferencia en destino
    const txIn = {
      id: `tx-tf-in-${timestamp + 1}-${Math.random().toString(36).substr(2, 4)}`,
      elementId: null,
      walletId: destWallet.id,
      walletName: destWallet.name,
      amount: numAmount,
      type: 'transfer_in',
      concept: `Transferencia recibida de @${sourceWallet.alias || sourceWallet.name}: ${transferConcept}`,
      memberId: memberId || 'ramiro',
      memberName: memberName || 'Ramiro',
      date: dateStr,
      timestamp: timestamp + 1,
      transferDetails: {
        operationNumber,
        referenceCode,
        sourceWalletId: sourceWallet.id,
        sourceWalletName: sourceWallet.name,
        sourceWalletAlias: sourceWallet.alias,
        destWalletId: destWallet.id,
        destWalletName: destWallet.name,
        destWalletAlias: destWallet.alias,
        direction: 'in'
      }
    };

    const currentTxs = Array.isArray(this.transactions) ? this.transactions : this.loadStoredTransactions();
    const updatedTxs = [txIn, txOut, ...currentTxs];
    this.saveStoredTransactions(updatedTxs);

    // Persistencia en Firebase si está habilitado
    if (db) {
      try {
        await addDoc(collection(db, 'banca_abeja_element_transactions'), txOut);
        await addDoc(collection(db, 'banca_abeja_element_transactions'), txIn);
      } catch (e) {
        console.warn("Firestore error al guardar transferencias:", e);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('banca_transfer_completed', {
        detail: {
          operationNumber,
          referenceCode,
          sourceWalletId,
          destinationWalletId,
          amount: numAmount
        }
      }));
    } catch (e) {}

    return {
      success: true,
      operationNumber,
      referenceCode,
      amount: numAmount,
      sourceWallet: { ...sourceWallet, balance: newSourceBal },
      destWallet: { ...destWallet, balance: newDestBal },
      concept: transferConcept,
      date: dateStr,
      timestamp
    };
  }

  getElementsByWallet(walletId) {
    const targetId = walletId || this.getActiveWalletId();
    return (this.elements || []).filter(elem => {
      const isDirectMatch = elem.walletId === targetId || (targetId === 'wallet-elementales' && !elem.walletId);
      const isCoOwned = Array.isArray(elem.walletIds) && elem.walletIds.includes(targetId);
      return isDirectMatch || isCoOwned;
    });
  }

  // --- CREAR ELEMENTO ---
  async createElement({
    name,
    type = 'individual', // 'individual' | 'shared' | 'bilateral'
    creatorId = 'ramiro',
    creatorName = 'Ramiro',
    icon = '📦',
    category = 'General',
    description = '',
    members = [],
    walletId = null,
    initialDeposit = 0,
    currency = 'ARS'
  }) {
    const targetWalletId = walletId || this.getActiveWalletId() || 'wallet-elementales';
    const newId = `elem-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    
    // Asegurar que el creador esté siempre entre los miembros
    const memberList = Array.from(new Set([creatorId, ...(members || [])]));

    const newElement = {
      id: newId,
      name: name.trim(),
      type,
      creatorId,
      creatorName,
      icon,
      category,
      description: description.trim(),
      members: memberList,
      initialBalance: 0,
      walletId: targetWalletId,
      currency,
      createdAt: Date.now()
    };

    const updatedElements = [newElement, ...this.elements];
    this.saveStoredElements(updatedElements);

    // Asociar a la billetera en su lista elementIds si aplica
    const wallet = this.getWalletById(targetWalletId);
    if (wallet && Array.isArray(wallet.elementIds) && !wallet.elementIds.includes(newId)) {
      this.updateWallet(targetWalletId, {
        elementIds: [...wallet.elementIds, newId]
      });
    }

    // Si hubo un depósito inicial desde la cuenta principal / billetera
    if (initialDeposit > 0) {
      await this.depositToElement({
        elementId: newId,
        memberId: creatorId,
        memberName: creatorName,
        amount: initialDeposit,
        concept: 'Fondo o depósito inicial de apertura',
        currency
      });
    }

    // Sincronizar en Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_elements', newId), newElement);
      } catch (e) {
        console.warn("Firestore error al crear elemento:", e);
      }
    }

    return newElement;
  }

  // --- DEPOSITAR EN UN ELEMENTO ---
  // Un integrante deposita saldo en el elemento (sale de su cuenta/billetera y entra al elemento)
  async depositToElement({
    elementId,
    memberId,
    memberName,
    amount,
    concept = 'Depósito en elemento',
    currency = 'ARS'
  }) {
    const numAmount = Math.abs(parseFloat(amount) || 0);
    if (numAmount <= 0) return null;

    const elem = this.elements.find(e => e.id === elementId);
    const targetWalletId = elem?.walletId || this.getActiveWalletId();

    const tx = {
      id: `etx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      elementId,
      type: 'deposit',
      amount: numAmount,
      concept: concept.trim() || 'Depósito en elemento',
      memberId,
      memberName: memberName || (memberId.charAt(0).toUpperCase() + memberId.slice(1)),
      currency,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('es-AR')
    };

    const updatedTxs = [tx, ...this.transactions];
    this.saveStoredTransactions(updatedTxs);

    // Descontar de la caja libre de la billetera si posee saldo sin asignar
    const currentWalletBal = this.getWalletBalance(targetWalletId);
    if (currentWalletBal > 0) {
      const deduction = Math.min(currentWalletBal, numAmount);
      await this.updateWalletBalance(targetWalletId, -deduction);
    }
    await this.updateMainBalance(memberId, -numAmount);

    if (db) {
      try {
        await addDoc(collection(db, 'banca_abeja_element_transactions'), tx);
      } catch (e) {
        console.warn("Firestore error al guardar depósito:", e);
      }
    }

    return tx;
  }

  // --- RETIRAR / RECIBIR DE UN ELEMENTO ---
  // Un integrante recibe o retira saldo del elemento hacia su cuenta/billetera
  async withdrawFromElement({
    elementId,
    memberId,
    memberName,
    amount,
    concept = 'Retiro / Distribución de elemento',
    currency = 'ARS'
  }) {
    const numAmount = Math.abs(parseFloat(amount) || 0);
    if (numAmount <= 0) return null;

    const elem = this.elements.find(e => e.id === elementId);
    const targetWalletId = elem?.walletId || this.getActiveWalletId();

    const tx = {
      id: `etx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      elementId,
      type: 'withdraw',
      amount: numAmount,
      concept: concept.trim() || 'Retiro de elemento',
      memberId,
      memberName: memberName || (memberId.charAt(0).toUpperCase() + memberId.slice(1)),
      currency,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('es-AR')
    };

    const updatedTxs = [tx, ...this.transactions];
    this.saveStoredTransactions(updatedTxs);

    // Sumar a la billetera y a la cuenta personal del usuario
    await this.updateWalletBalance(targetWalletId, numAmount);
    await this.updateMainBalance(memberId, numAmount);

    if (db) {
      try {
        await addDoc(collection(db, 'banca_abeja_element_transactions'), tx);
      } catch (e) {
        console.warn("Firestore error al guardar retiro:", e);
      }
    }

    return tx;
  }

  // --- REGISTRAR INGRESO AL ELEMENTO ---
  async addIncomeToElement({
    elementId,
    memberId,
    memberName,
    amount,
    concept,
    milestoneId = null,
    currency = 'ARS'
  }) {
    const numAmount = Math.abs(parseFloat(amount) || 0);
    if (numAmount <= 0) return null;

    const tx = {
      id: `etx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      elementId,
      type: 'income',
      amount: numAmount,
      concept: concept.trim() || 'Ingreso generado por el elemento',
      memberId,
      memberName: memberName || (memberId.charAt(0).toUpperCase() + memberId.slice(1)),
      milestoneId: milestoneId || null,
      currency,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('es-AR')
    };

    const updatedTxs = [tx, ...this.transactions];
    this.saveStoredTransactions(updatedTxs);

    if (db) {
      try {
        await addDoc(collection(db, 'banca_abeja_element_transactions'), tx);
      } catch (e) {
        console.warn("Firestore error al guardar ingreso:", e);
      }
    }

    return tx;
  }

  // --- REGISTRAR EGRESO / GASTO DEL ELEMENTO ---
  async addExpenseToElement({
    elementId,
    memberId,
    memberName,
    amount,
    concept,
    linkedElementId = null,
    linkedElementName = null,
    targetMemberId = null,
    milestoneId = null,
    currency = 'ARS'
  }) {
    const numAmount = Math.abs(parseFloat(amount) || 0);
    if (numAmount <= 0) return null;

    const tx = {
      id: `etx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      elementId,
      type: 'expense',
      amount: numAmount,
      concept: concept.trim() || 'Egreso / Necesidad económica',
      memberId,
      memberName: memberName || (memberId.charAt(0).toUpperCase() + memberId.slice(1)),
      linkedElementId: linkedElementId || null,
      linkedElementName: linkedElementName || null,
      targetMemberId: targetMemberId || null,
      milestoneId: milestoneId || null,
      currency,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('es-AR')
    };

    const updatedTxs = [tx, ...this.transactions];
    this.saveStoredTransactions(updatedTxs);

    if (db) {
      try {
        await addDoc(collection(db, 'banca_abeja_element_transactions'), tx);
      } catch (e) {
        console.warn("Firestore error al guardar egreso:", e);
      }
    }

    return tx;
  }

  // --- REGISTRAR GASTO CENTRALIZADO CON DIRECCIONAMIENTO A BILLETERA Y/O ELEMENTO ---
  async recordDirectedExpense({
    walletId,
    elementId = null,
    memberId = 'ramiro',
    memberName = 'Ramiro',
    amount,
    concept,
    date = null,
    milestoneId = null,
    category = null
  }) {
    const numAmount = Math.abs(parseFloat(amount) || 0);
    if (numAmount <= 0) return null;

    const wallet = this.wallets.find(w => w.id === walletId) || this.wallets[0];
    const elem = elementId ? this.elements.find(e => e.id === elementId) : null;

    const txDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR');

    const tx = {
      id: `etx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      walletId: wallet ? wallet.id : (elem?.walletId || 'wallet-elementales'),
      walletName: wallet ? wallet.name : 'Elementales',
      elementId: elem ? elem.id : null,
      elementName: elem ? elem.name : null,
      type: 'expense',
      amount: numAmount,
      concept: concept?.trim() || (elem ? `Gasto en ${elem.name}` : `Gasto en ${wallet?.name || 'Billetera'}`),
      memberId: memberId || 'ramiro',
      memberName: memberName || 'Ramiro',
      milestoneId: milestoneId || null,
      category: category || (elem ? elem.category : 'General'),
      currency: wallet?.currency || 'ARS',
      timestamp: Date.now(),
      date: txDate
    };

    // Si es un gasto directo a la billetera (sin elemento), descontar de la caja libre de la billetera
    if (!elem && wallet) {
      await this.updateWalletBalance(wallet.id, -numAmount);
    }

    const updatedTxs = [tx, ...this.transactions];
    this.saveStoredTransactions(updatedTxs);

    if (db) {
      try {
        await addDoc(collection(db, 'banca_abeja_element_transactions'), tx);
      } catch (e) {
        console.warn("Firestore error al guardar gasto direccionado:", e);
      }
    }

    return tx;
  }

  // --- OBTENER GASTOS CARGADOS POR UN USUARIO ---
  getUserExpenses(memberId) {
    if (!this.transactions || !Array.isArray(this.transactions)) {
      this.transactions = this.loadStoredTransactions();
    }
    const cleanId = String(memberId || '').toLowerCase();
    return (this.transactions || [])
      .filter(t => t && t.type === 'expense' && (
        String(t.memberId || '').toLowerCase() === cleanId ||
        String(t.memberName || '').toLowerCase() === cleanId
      ))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  // --- ELIMINAR TRANSACCIÓN / GASTO ---
  async deleteElementTransaction(txId) {
    const tx = (this.transactions || []).find(t => t.id === txId);
    if (!tx) return false;

    // Si fue un gasto directo de billetera, restaurar el saldo
    if (!tx.elementId && tx.walletId && tx.type === 'expense') {
      await this.updateWalletBalance(tx.walletId, tx.amount);
    }

    this.transactions = (this.transactions || []).filter(t => t.id !== txId);
    this.saveStoredTransactions(this.transactions);

    if (db) {
      try {
        const q = query(collection(db, 'banca_abeja_element_transactions'), where('id', '==', txId));
        const snap = await getDocs(q);
        snap.forEach(async docSnap => {
          await deleteDoc(docSnap.ref);
        });
      } catch (e) {
        console.warn("Firestore error al eliminar transacción:", e);
      }
    }
    return true;
  }

  // --- RE-DIRECCIONAR GASTO A OTRA BILLETERA O ELEMENTO ---
  async redirectTransaction(txId, newWalletId, newElementId = null) {
    if (!this.transactions) this.transactions = this.loadStoredTransactions();
    const txIndex = this.transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) return null;

    const oldTx = this.transactions[txIndex];
    const newWallet = this.wallets.find(w => w.id === newWalletId) || this.wallets[0];
    const newElem = newElementId ? this.elements.find(e => e.id === newElementId) : null;

    // Manejar balances de billetera si aplica
    if (!oldTx.elementId && oldTx.walletId && oldTx.type === 'expense') {
      await this.updateWalletBalance(oldTx.walletId, oldTx.amount); // Revertir en la anterior
    }
    if (!newElem && newWallet && oldTx.type === 'expense') {
      await this.updateWalletBalance(newWallet.id, -oldTx.amount); // Descontar en la nueva
    }

    const updatedTx = {
      ...oldTx,
      walletId: newWallet.id,
      walletName: newWallet.name,
      elementId: newElem ? newElem.id : null,
      elementName: newElem ? newElem.name : null
    };

    this.transactions[txIndex] = updatedTx;
    this.saveStoredTransactions(this.transactions);

    return updatedTx;
  }
  getMilestonesByElement(elementId) {
    if (!this.milestones || !Array.isArray(this.milestones)) {
      this.milestones = this.loadStoredMilestones();
    }
    return (this.milestones || []).filter(m => m && m.elementId === elementId);
  }

  getActiveMilestones(elementId) {
    return this.getMilestonesByElement(elementId).filter(m => m.status === 'open');
  }

  getMilestoneById(milestoneId) {
    if (!this.milestones) this.milestones = this.loadStoredMilestones();
    return (this.milestones || []).find(m => m && m.id === milestoneId) || null;
  }

  async createMilestone({
    elementId,
    name,
    initialSeedFund = 0,
    goalDescription = '',
    startDate = null
  }) {
    const newId = `milestone-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const newMilestone = {
      id: newId,
      elementId,
      name: name.trim(),
      startDate: startDate || new Date().toLocaleDateString('es-AR'),
      endDate: null,
      status: 'open',
      initialSeedFund: Number(initialSeedFund) || 0,
      goalDescription: goalDescription.trim(),
      netResult: null,
      createdAt: Date.now()
    };

    const updated = [newMilestone, ...(this.milestones || [])];
    this.saveStoredMilestones(updated);

    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_milestones', newId), newMilestone);
      } catch (e) {
        console.warn("Firestore error al crear hito:", e);
      }
    }
    return newMilestone;
  }

  async closeMilestone(milestoneId, summaryReport = '') {
    const milestone = this.getMilestoneById(milestoneId);
    if (!milestone) return null;

    const stats = this.getMilestoneStats(milestoneId);
    const netResult = stats.netResult;

    const updates = {
      status: 'closed',
      endDate: new Date().toLocaleDateString('es-AR'),
      netResult,
      summaryReport: summaryReport.trim(),
      closedAt: Date.now()
    };

    const updatedList = (this.milestones || []).map(m => {
      if (m.id === milestoneId) {
        return { ...m, ...updates };
      }
      return m;
    });
    this.saveStoredMilestones(updatedList);

    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_milestones', milestoneId), updates, { merge: true });
      } catch (e) {
        console.warn("Firestore error al cerrar hito:", e);
      }
    }

    return { ...milestone, ...updates };
  }

  getMilestoneStats(milestoneId) {
    const mTxs = (this.transactions || []).filter(t => t && t.milestoneId === milestoneId);
    let totalIncomes = 0;
    let totalExpenses = 0;

    mTxs.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') totalIncomes += amt;
      else if (t.type === 'expense') totalExpenses += amt;
    });

    const netResult = totalIncomes - totalExpenses;
    return {
      totalIncomes,
      totalExpenses,
      netResult,
      txCount: mTxs.length,
      transactions: mTxs
    };
  }

  // --- BASE DE COSTOS E INSUMOS (PLANILLA VIVA) ---
  async addCostItemToElement(elementId, { name, unitCost, unit = 'unidad', category = 'Insumos' }) {
    const elem = (this.elements || []).find(e => e.id === elementId);
    if (!elem) return null;

    const newItem = {
      id: `cost-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      unitCost: Number(unitCost) || 0,
      unit: (unit || 'unidad').trim(),
      category: (category || 'Insumos').trim()
    };

    const existingCostBase = Array.isArray(elem.costBase) ? elem.costBase : [];
    const updatedCostBase = [...existingCostBase, newItem];

    const updatedElements = this.elements.map(e => {
      if (e.id === elementId) {
        return { ...e, costBase: updatedCostBase };
      }
      return e;
    });
    this.saveStoredElements(updatedElements);

    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_elements', elementId), { costBase: updatedCostBase }, { merge: true });
      } catch (e) {
        console.warn("Firestore error al agregar insumo de costo:", e);
      }
    }
    return newItem;
  }

  async deleteCostItemFromElement(elementId, costItemId) {
    const elem = (this.elements || []).find(e => e.id === elementId);
    if (!elem || !Array.isArray(elem.costBase)) return;

    const updatedCostBase = elem.costBase.filter(c => c.id !== costItemId);
    const updatedElements = this.elements.map(e => {
      if (e.id === elementId) {
        return { ...e, costBase: updatedCostBase };
      }
      return e;
    });
    this.saveStoredElements(updatedElements);

    if (db) {
      try {
        await setDoc(doc(db, 'banca_abeja_elements', elementId), { costBase: updatedCostBase }, { merge: true });
      } catch (e) {
        console.warn("Firestore error al eliminar insumo de costo:", e);
      }
    }
  }

  // --- GENERACIÓN DE INFORME EJECUTIVO DE BILLETERA ---
  generateWalletReport(walletId) {
    const targetId = walletId || this.getActiveWalletId();
    const wallet = this.getWalletById(targetId);
    if (!wallet) return null;

    const walletElements = this.getElementsByWallet(targetId);
    const balance = this.getWalletBalance(targetId);
    const rules = wallet.rules || {};

    const elementsSummary = walletElements.map(el => {
      const stats = this.getElementStats(el.id);
      const activeMilestones = this.getActiveMilestones(el.id);
      return {
        id: el.id,
        name: el.name,
        icon: el.icon || '📦',
        type: el.type,
        currentBalance: stats.currentBalance,
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
        activeMilestonesCount: activeMilestones.length
      };
    });

    const totalElementsBalance = elementsSummary.reduce((acc, el) => acc + (el.currentBalance || 0), 0);

    const walletElemIds = new Set(walletElements.map(e => e.id));
    const recentTxs = (this.transactions || [])
      .filter(t => t && (walletElemIds.has(t.elementId) || walletElemIds.has(t.linkedElementId)))
      .slice(0, 15);

    const safeMoney = (v) => `$${Number(v || 0).toLocaleString('es-AR')}`;
    let waText = `🐝 *INFORME EJECUTIVO - BANCA ABEJA*\n`;
    waText += `💼 *Billetera:* ${wallet.name} (@${wallet.alias || wallet.name.toLowerCase()})\n`;
    waText += `💰 *Saldo en Caja:* ${safeMoney(balance)}\n`;
    waText += `📦 *Saldo en Elementos:* ${safeMoney(totalElementsBalance)} (${walletElements.length} elementos)\n`;
    waText += `👥 *Integrantes:* ${(wallet.members || []).join(', ')}\n\n`;

    if (rules.agreementSummary) {
      waText += `📜 *Reglas & Acuerdos:*\n`;
      waText += `• ${rules.agreementSummary}\n`;
      if (rules.expenseApprovalThreshold) {
        waText += `• Límite aprobación sin consulta: ${safeMoney(rules.expenseApprovalThreshold)}\n`;
      }
      if (rules.reservePercentage) {
        waText += `• Fondo de resguardo: ${rules.reservePercentage}%\n`;
      }
      waText += `\n`;
    }

    waText += `📊 *Resumen de Elementos:*\n`;
    elementsSummary.forEach(el => {
      waText += `• ${el.icon} *${el.name}*: ${safeMoney(el.currentBalance)}`;
      if (el.activeMilestonesCount > 0) {
        waText += ` (${el.activeMilestonesCount} hito activo)`;
      }
      waText += `\n`;
    });

    if (recentTxs.length > 0) {
      waText += `\n📝 *Últimos Movimientos:*\n`;
      recentTxs.slice(0, 5).forEach(tx => {
        const sign = tx.type === 'expense' ? '-' : '+';
        waText += `• ${tx.date} | ${sign}${safeMoney(tx.amount)}: ${tx.concept} (${tx.memberName})\n`;
      });
    }

    waText += `\n🌐 _Banca Abeja - Economía Colectiva Consciente_`;

    return {
      wallet,
      balance,
      totalElementsBalance,
      elementsSummary,
      rules,
      recentTxs,
      whatsAppText: waText
    };
  }

  getLinkedTransactions(elementId) {
    if (!this.transactions || !Array.isArray(this.transactions)) return [];
    return this.transactions.filter(t => t && t.linkedElementId === elementId);
  }

  // --- CÁLCULO DE BALANCE DE UN ELEMENTO ---
  getElementStats(elementId) {
    if (!this.transactions || !Array.isArray(this.transactions)) {
      this.transactions = this.loadStoredTransactions();
    }
    const elemTxs = (this.transactions || []).filter(t => t && t.elementId === elementId);

    let totalIncome = 0;
    let totalExpense = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    const memberContributions = {};

    elemTxs.forEach(t => {
      const amt = Number(t?.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
      } else if (t.type === 'expense') {
        totalExpense += amt;
      } else if (t.type === 'deposit') {
        totalDeposits += amt;
        const m = t.memberId || 'amigo';
        memberContributions[m] = (memberContributions[m] || 0) + amt;
      } else if (t.type === 'withdraw') {
        totalWithdrawals += amt;
      }
    });

    const currentBalance = (totalIncome + totalDeposits) - (totalExpense + totalWithdrawals);

    return {
      currentBalance: isNaN(currentBalance) ? 0 : currentBalance,
      totalIncome: isNaN(totalIncome) ? 0 : totalIncome,
      totalExpense: isNaN(totalExpense) ? 0 : totalExpense,
      totalDeposits: isNaN(totalDeposits) ? 0 : totalDeposits,
      totalWithdrawals: isNaN(totalWithdrawals) ? 0 : totalWithdrawals,
      memberContributions,
      txCount: elemTxs.length,
      recentTxs: elemTxs.slice(0, 10)
    };
  }

  // --- ELIMINAR ELEMENTO ---
  async deleteElement(elementId) {
    const updated = this.elements.filter(e => e.id !== elementId);
    this.saveStoredElements(updated);

    if (db) {
      try {
        await deleteDoc(doc(db, 'banca_abeja_elements', elementId));
      } catch (e) {
        console.warn("Firestore error al eliminar elemento:", e);
      }
    }
  }
}

export const elementsService = new ElementsService();
