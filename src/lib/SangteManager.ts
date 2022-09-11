import { Sangte, SangteInstance } from './sangte'
import { SangteInitializer } from './SangteInitializer'

export class SangteManager {
  private instanceMap = new Map<Sangte<any, any>, SangteInstance<any, any>>()
  public initializer: SangteInitializer = new SangteInitializer(this)
  public children = new Set<SangteManager>()

  constructor(public isDefault: boolean = false) {}
  public get<T, A>(sangte: Sangte<T, A>): SangteInstance<T, A> {
    const manager = sangte.config.global ? this.getRootSangteManager() : this
    const instance = manager.instanceMap.get(sangte)

    if (instance) {
      return instance
    }
    const newInstance = sangte(this)
    if (sangte.config.key && this.dehydratedState && !sangte.config.isResangte) {
      const selected = this.dehydratedState[sangte.config.key]
      if (selected) {
        newInstance.setState(selected)
      }
    }

    manager.instanceMap.set(sangte, newInstance)
    return newInstance
  }

  public parent: SangteManager | null = null
  public dehydratedState?: Record<string, any> | null

  public getRootSangteManager(): SangteManager {
    let manager: SangteManager | undefined = this
    while (manager.parent) {
      manager = manager.parent
    }
    return manager
  }

  public inherit(sangtes: Sangte<any>[]) {
    const parent = this.parent
    if (!parent) return
    sangtes.forEach((sangte) => {
      const sangteInstance = parent.get(sangte)
      this.instanceMap.set(sangte, sangteInstance)
    })
  }

  /** resets all sangte registered to this SangteManager */
  public reset(global: boolean = false) {
    if (global) {
      this.getRootSangteManager().reset()
      return
    }
    Array.from(this.instanceMap.entries()).forEach(([sangte, instance]) => {
      if (!sangte.config.isResangte) {
        instance.reset()
      }
    })
    this.children.forEach((child) => child.reset())
  }
}
