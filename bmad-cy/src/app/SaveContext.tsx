import { createContext, useContext } from 'react'
export interface SaveState { run: (operation: () => Promise<unknown>) => Promise<boolean> }
export const SaveContext = createContext<SaveState>({ run: async () => false })
export function useSave() { return useContext(SaveContext) }
