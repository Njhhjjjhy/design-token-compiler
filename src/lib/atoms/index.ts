export { ATOM_DEFINITIONS } from './definitions'

// Returns a deep clone of all atom definitions (safe to mutate)
export function getSeedComponents() {
  return JSON.parse(JSON.stringify(ATOM_DEFINITIONS))
}
