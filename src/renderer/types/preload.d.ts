export {}

declare global {
  type EntityChannel =
    | 'clientes:changed'
    | 'productos:changed'
    | 'metodos:changed'
    | 'ventas:changed'

  interface Window {
    entityEvents: {
      on: (channel: EntityChannel, listener: (payload: unknown) => void) => (() => void) | void
      off: (channel: EntityChannel, listener: (payload: unknown) => void) => void
      once: (channel: EntityChannel, listener: (payload: unknown) => void) => void
    }
  }
}
