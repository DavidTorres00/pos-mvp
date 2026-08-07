// qz-tray no publica tipos — se declara aquí solo la superficie que la app usa
// (ver src/lib/qzPrint.ts), no la API completa de la librería.
declare module 'qz-tray' {
  interface QzPrintData {
    type: 'pixel'
    format: 'html'
    flavor: 'plain'
    data: string
  }

  interface QzConfig {
    [key: string]: unknown
  }

  const qz: {
    websocket: {
      connect(): Promise<void>
      isActive(): boolean
    }
    security: {
      setCertificatePromise(promiser: (resolve: (value?: string) => void, reject: (reason?: unknown) => void) => void): void
      setSignaturePromise(
        signer: (toSign: string) => (resolve: (value?: string) => void, reject: (reason?: unknown) => void) => void,
      ): void
    }
    printers: {
      getDefault(): Promise<string>
    }
    configs: {
      create(printer: string): QzConfig
    }
    print(config: QzConfig, data: QzPrintData[]): Promise<void>
  }

  export default qz
}
