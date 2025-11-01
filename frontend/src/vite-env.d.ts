/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STELLAR_NETWORK: string
  readonly VITE_STELLAR_HORIZON_URL: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_SOCIAL_CONTRACT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// SVG imports
declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.svg?react' {
  import * as React from 'react'
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  export default ReactComponent
}
