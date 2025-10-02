import { EventEmitter } from 'events'
export const appBus = new EventEmitter()

export const emitChange = (channel: string, payload: any) => appBus.emit(channel, payload)
export const onChange  = (channel: string, fn: (p:any)=>void) => appBus.on(channel, fn)
