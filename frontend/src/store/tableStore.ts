import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { tableAPI } from "../services/api";
import { type Table, TableStatus } from "../types/table";
import socketService from "../services/socket";

interface TableState {
  tables: Table[];
  currentTable: Table | null;
  isLoading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDetailsModalOpen: boolean;

  // Actions
  fetchTables: () => Promise<void>;
  fetchTable: (id: string) => Promise<void>;
  createTable: (table: Partial<Table>) => Promise<Table | null>;
  updateTable: (id: string, table: Partial<Table>) => Promise<Table | null>;
  deleteTable: (id: string) => Promise<boolean>;
  updateTableStatus: (id: string, status: TableStatus) => Promise<Table | null>;
  clearError: () => void;
  setupSocketListeners: () => void;
  setAddModalOpen: (isOpen: boolean) => void;
  setEditModalOpen: (isOpen: boolean) => void;
  setDetailsModalOpen: (isOpen: boolean) => void;
  setCurrentTable: (table: Table | null) => void;
}

export const useTableStore = create<TableState>()(
  devtools(
    (set, get) => ({
      tables: [],
      currentTable: null,
      isLoading: false,
      error: null,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDetailsModalOpen: false,

      fetchTables: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await tableAPI.getTables();
          set({ tables: data, isLoading: false });
        } catch (error) {
          console.error("Failed to fetch tables:", error);
          set({
            error: "Failed to fetch tables. Please try again.",
            isLoading: false,
          });
        }
      },

      fetchTable: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const data = await tableAPI.getTable(id);
          set({ currentTable: data, isLoading: false });
        } catch (error) {
          console.error(`Failed to fetch table ${id}:`, error);
          set({
            error: `Failed to fetch table details. Please try again.`,
            isLoading: false,
          });
        }
      },

      createTable: async (table: Partial<Table>) => {
        try {
          set({ isLoading: true, error: null });
          const data = await tableAPI.createTable(table);
          set((state) => ({
            tables: [...state.tables, data],
            isLoading: false,
            isAddModalOpen: false,
          }));
          return data;
        } catch (error) {
          console.error("Failed to create table:", error);
          set({
            error: "Failed to create table. Please try again.",
            isLoading: false,
          });
          return null;
        }
      },

      updateTable: async (id: string, table: Partial<Table>) => {
        try {
          set({ isLoading: true, error: null });
          const data = await tableAPI.updateTable(id, table);
          set((state) => ({
            tables: state.tables.map((t) => (t.id === id ? data : t)),
            currentTable: data,
            isLoading: false,
            isEditModalOpen: false,
          }));
          return data;
        } catch (error) {
          console.error(`Failed to update table ${id}:`, error);
          set({
            error: "Failed to update table. Please try again.",
            isLoading: false,
          });
          return null;
        }
      },

      deleteTable: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await tableAPI.deleteTable(id);
          set((state) => ({
            tables: state.tables.filter((t) => t.id !== id),
            isLoading: false,
          }));
          return true;
        } catch (error) {
          console.error(`Failed to delete table ${id}:`, error);
          set({
            error: "Failed to delete table. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      updateTableStatus: async (id: string, status: TableStatus) => {
        try {
          set({ isLoading: true, error: null });
          const data = await tableAPI.updateTableStatus(id, status);
          set((state) => ({
            tables: state.tables.map((t) => (t.id === id ? { ...t, status } : t)),
            currentTable: state.currentTable?.id === id ? { ...state.currentTable, status } : state.currentTable,
            isLoading: false,
          }));
          return data;
        } catch (error) {
          console.error(`Failed to update table status ${id}:`, error);
          set({
            error: "Failed to update table status. Please try again.",
            isLoading: false,
          });
          return null;
        }
      },

      clearError: () => set({ error: null }),

      setupSocketListeners: () => {
        socketService.on("table:status", (updatedTable: Table) => {
          set((state) => ({
            tables: state.tables.map((table) =>
              table.id === updatedTable.id ? updatedTable : table
            ),
            currentTable:
              state.currentTable?.id === updatedTable.id
                ? updatedTable
                : state.currentTable,
          }));
        });
      },

      setAddModalOpen: (isOpen: boolean) => set({ isAddModalOpen: isOpen }),
      setEditModalOpen: (isOpen: boolean) => set({ isEditModalOpen: isOpen }),
      setDetailsModalOpen: (isOpen: boolean) => set({ isDetailsModalOpen: isOpen }),
      setCurrentTable: (table: Table | null) => set({ currentTable: table }),
    }),
    { name: "table-store" }
  )
);
