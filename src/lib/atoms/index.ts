import { ATOM_DEFINITIONS } from './definitions'

export { ATOM_DEFINITIONS }

// Returns a deep clone of all atom definitions (safe to mutate)
export function getSeedComponents() {
  return JSON.parse(JSON.stringify(ATOM_DEFINITIONS))
}
