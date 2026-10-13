// Servicio de Gestión de Elementos y Cuenta Principal (Banca Abeja)
// Maneja la persistencia de Elementos (Individuales y Compartidos),
// sus flujos económicos (Ingresos, Egresos, Depósitos, Retiros) y la cuenta principal.

import { db } from '../firebase';
import { 
  collection, doc, getDoc, setDoc, addDoc, updateDoc, 
  deleteDoc, onSnapshot, query, orderBy, where 
} from 'firebase/firestore';

const STORAGE_ELEMENTS_KEY = 'banca_abeja_elements_v2';
const STORAGE_ACCOUNT_KEY = 'banca_abeja_main_accounts_v2';
const STORAGE_ELEMENT_TXS_KEY = 'banca_abeja_element_transactions_v2';

// Semillas iniciales demostrativas para la prueba del usuario (Clio, Comida, etc.)
export const DEFAULT_ELEMENTS = [
  {
    id: 'elem-clio',
    name: 'Clio',
    type: 'shared', // 'shared' | 'individual'
    creatorId: 'ramiro',
    creatorName: 'Ramiro',
    icon: '🚗',
    category: 'Movilidad',
    description: 'Gestión de combustible, service y uso compartido del Renault Clio.',
    members: ['ramiro', 'agustina', 'cristian'],
    initialBalance: 0,
    currency: 'ARS',
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
    createdAt: Date.now() - 86400000 * 2
  }
];

// Movimientos iniciales de prueba para Clio, Comida, etc.
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
  }
];

class ElementsService {
  constructor() {
    this.elements = this.loadStoredElements();
    this.transactions = this.loadStoredTransactions();
    this.accounts = this.loadStoredAccounts();
  }

  // --- PERSISTENCIA LOCAL ---
  loadStoredElements() {
    try {
      const saved = localStorage.getItem(STORAGE_ELEMENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Error leyendo elementos locales:", e);
    }
    return DEFAULT_ELEMENTS;
  }

  saveStoredElements(elements) {
    this.elements = elements;
    try {
      localStorage.setItem(STORAGE_ELEMENTS_KEY, JSON.stringify(elements));
    } catch (e) {}
  }

  loadStoredTransactions() {
    try {
      const saved = localStorage.getItem(STORAGE_ELEMENT_TXS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Error leyendo transacciones de elementos:", e);
    }
    return DEFAULT_ELEMENT_TXS;
  }

  saveStoredTransactions(txs) {
    this.transactions = txs;
    try {
      localStorage.setItem(STORAGE_ELEMENT_TXS_KEY, JSON.stringify(txs));
    } catch (e) {}
  }

  loadStoredAccounts() {
    try {
      const saved = localStorage.getItem(STORAGE_ACCOUNT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      ramiro: { balance: 450000, updatedAt: Date.now() },
      agustina: { balance: 280000, updatedAt: Date.now() },
      cristian: { balance: 220000, updatedAt: Date.now() }
    };
  }

  saveStoredAccounts(accounts) {
    this.accounts = accounts;
    try {
      localStorage.setItem(STORAGE_ACCOUNT_KEY, JSON.stringify(accounts));
    } catch (e) {}
  }

  // --- CUENTA PRINCIPAL DEL USUARIO ---
  getMainBalance(userId = 'ramiro') {
    const acc = this.accounts[userId];
    if (acc && typeof acc.balance === 'number') return acc.balance;
    return 350000;
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

  // --- CREAR ELEMENTO ---
  async createElement({
    name,
    type = 'individual', // 'individual' | 'shared'
    creatorId = 'ramiro',
    creatorName = 'Ramiro',
    icon = '📦',
    category = 'General',
    description = '',
    members = [],
    initialDeposit = 0,
    currency = 'ARS'
  }) {
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
      currency,
      createdAt: Date.now()
    };

    const updatedElements = [newElement, ...this.elements];
    this.saveStoredElements(updatedElements);

    // Si hubo un depósito inicial desde la cuenta principal
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
  // Un integrante deposita saldo en el elemento (sale de su cuenta principal y entra al elemento)
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

    // Descontar de la cuenta principal del usuario
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
  // Un integrante recibe o retira saldo del elemento hacia su cuenta principal
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

    // Sumar a la cuenta principal del usuario
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
  // El elemento genera un ingreso económico (ej: venta de viandas de Comida, o flete del Clio)
  async addIncomeToElement({
    elementId,
    memberId,
    memberName,
    amount,
    concept,
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
  // El elemento tiene una necesidad económica / gasto (ej: nafta del Clio, compras de verdulería de Comida)
  async addExpenseToElement({
    elementId,
    memberId,
    memberName,
    amount,
    concept,
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

  // --- CÁLCULO DE BALANCE DE UN ELEMENTO ---
  getElementStats(elementId) {
    const elemTxs = this.transactions.filter(t => t.elementId === elementId);

    let totalIncome = 0;
    let totalExpense = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    const memberContributions = {}; // memberId -> total deposited

    elemTxs.forEach(t => {
      const amt = Number(t.amount) || 0;
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
      currentBalance,
      totalIncome,
      totalExpense,
      totalDeposits,
      totalWithdrawals,
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
