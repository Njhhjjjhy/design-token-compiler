// ============================================================================
// TOKEN TYPES
// ============================================================================

export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'strokeStyle'
  | 'border'
  | 'transition'
  | 'shadow'
  | 'gradient'
  | 'typography'

export type TokenValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | TokenValue[]

export interface Token {
  id: string
  name: string
  value: TokenValue
  type: TokenType
  description?: string
  // Reference support: value can be "{token.path}" string
  $type?: TokenType
  $value?: TokenValue
  $description?: string
}

export interface TokenGroup {
  id: string
  name: string
  tokens: Record<string, Token | TokenGroup>
  description?: string
}

// ============================================================================
// MODE TYPES
// ============================================================================

export interface Mode {
  id: string
  name: string
  overrides: Record<string, TokenValue> // tokenId -> overridden value
  isDefault?: boolean
}

export type ModeMap = Record<string, Mode>

// ============================================================================
// TOKEN SET TYPES
// ============================================================================

export interface TokenSet {
  id: string
  name: string
  tokens: Record<string, Token | TokenGroup>
  modes: ModeMap
  activeMode: string | null
  metadata: {
    createdAt: number
    updatedAt: number
    version: string
  }
}

// ============================================================================
// RESOLVED TOKEN TYPES
// ============================================================================

export interface ResolvedToken extends Token {
  resolvedValue: TokenValue
  hasReference: boolean
  referencePath?: string[]
  error?: string
}

export type ResolvedTokenMap = Record<string, ResolvedToken>

// ============================================================================
// RESOLUTION RESULT
// ============================================================================

export interface ResolutionResult {
  tokens: ResolvedTokenMap
  errors: ResolutionError[]
  circular: string[][]
}

export interface ResolutionError {
  tokenId: string
  tokenPath: string
  error: 'missing_reference' | 'circular_reference' | 'invalid_value' | 'type_mismatch'
  message: string
  reference?: string
}

// ============================================================================
// COMPILATION TYPES
// ============================================================================

export type CompilationFormat =
  | 'css'
  | 'scss'
  | 'typescript'
  | 'json'
  | 'tailwind'
  | 'swift'
  | 'kotlin'
  | 'style-dictionary'

export interface CompilationTarget {
  format: CompilationFormat
  fileName: string
  options?: CompilationOptions
}

export interface CompilationOptions {
  prefix?: string
  includeComments?: boolean
  prettify?: boolean
  customTemplate?: string
  [key: string]: unknown
}

export interface CompilationResult {
  format: CompilationFormat
  content: string
  fileName: string
  error?: string
}

// ============================================================================
// SYNC AND DIFF TYPES
// ============================================================================

export type DiffStatus = 'matching' | 'mismatch' | 'design_only' | 'code_only'

export interface TokenDiff {
  tokenId: string
  tokenPath: string
  status: DiffStatus
  designValue?: TokenValue
  codeValue?: TokenValue
  type?: TokenType
}

export interface SyncResult {
  matches: TokenDiff[]
  mismatches: TokenDiff[]
  designOnly: TokenDiff[]
  codeOnly: TokenDiff[]
  totalTokens: number
}

export interface SyncSource {
  type: 'figma' | 'css' | 'scss' | 'json'
  content: string
  fileName?: string
}

// ============================================================================
// VERSION TYPES
// ============================================================================

export interface Version {
  id: string
  name: string
  snapshot: TokenSet
  createdAt: number
  description?: string
  tags?: string[]
}

export interface VersionHistory {
  versions: Version[]
  current: string | null
}

// ============================================================================
// STORE STATE
// ============================================================================

export interface AppState {
  tokenSets: Record<string, TokenSet>
  activeSetId: string | null
  versionHistory: Record<string, VersionHistory> // setId -> history
  syncResults: Record<string, SyncResult> // setId -> last sync
}

// ============================================================================
// IMPORT/EXPORT TYPES
// ============================================================================

export interface ImportResult {
  success: boolean
  tokenSet?: TokenSet
  errors?: string[]
  warnings?: string[]
}

export interface ExportOptions {
  formats: CompilationFormat[]
  includeAllModes?: boolean
  zipFileName?: string
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type ViewMode = 'dashboard' | 'editor' | 'browser' | 'compiler' | 'sync'

export interface EditorState {
  selectedTokenId: string | null
  expandedGroups: Set<string>
  searchQuery: string
  filterType: TokenType | null
}

export interface BrowserState {
  groupBy: 'type' | 'name' | 'value'
  sortBy: 'name' | 'type' | 'updated'
  sortDirection: 'asc' | 'desc'
}

export interface CompilerState {
  selectedFormats: CompilationFormat[]
  compilationResults: CompilationResult[]
  autoCompile: boolean
}

export interface SyncState {
  source: SyncSource | null
  syncResult: SyncResult | null
  resolveConflicts: Record<string, 'design' | 'code'> // tokenId -> chosen value
}
