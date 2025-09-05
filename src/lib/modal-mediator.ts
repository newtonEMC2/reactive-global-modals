interface ModalState {
  id: string
  isOpen: boolean
}

// Update subscriber type to use ModalState
type ModalSubscriber = (modals: Map<string, ModalState>) => void

/**
 * Modal Mediator implements the Mediator pattern to manage modal state
 * with a pub/sub (Observable) pattern for notifying components.
 */
class ModalMediatorService {
  // Use Map of ModalState for extensibility
  private modals = new Map<string, ModalState>()
  // Set for faster subscriber management
  private subscribers = new Set<ModalSubscriber>()
  // Track modal opening order for Escape key handling
  private openOrder: string[] = []

  constructor() {
    // Handle Escape key globally to close most recent modal
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const lastOpenModal = this.getLastOpenModal()
        if (lastOpenModal) {
          this.closeModal(lastOpenModal)
        }
      }
    })
  }

  /**
   * Get the most recently opened modal ID
   */
  private getLastOpenModal(): string | null {
    // Go through openOrder in reverse to find the last open modal
    for (let i = this.openOrder.length - 1; i >= 0; i--) {
      const modalId = this.openOrder[i]
      if (this.isModalOpen(modalId)) {
        return modalId
      }
    }
    return null
  }

  /**
   * Subscribe to modal state changes
   * @param subscriber Function to call when modal state changes
   * @returns Unsubscribe function
   */
  subscribe(subscriber: ModalSubscriber): () => void {
    this.subscribers.add(subscriber)

    // Immediately notify with current state - create a new map to avoid mutations
    subscriber(new Map(this.modals))

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  /**
   * Notify all subscribers of state changes
   */
  private notify(): void {
    // Create a copy of the map to prevent mutations from subscribers
    const modalsCopy = new Map(this.modals)

    // Notify all subscribers with the map directly
    this.subscribers.forEach(subscriber => subscriber(modalsCopy))
  }

  /**
   * Open a modal by ID
   * @param id Modal identifier
   */
  openModal(id: string): void {
    // Create or update modal state
    this.modals.set(id, { id, isOpen: true })

    // Track opening order (remove if already exists, then add to end)
    this.openOrder = this.openOrder.filter(modalId => modalId !== id)
    this.openOrder.push(id)

    this.notify()
  }

  /**
   * Close a modal by ID
   * @param id Modal identifier
   */
  closeModal(id: string): void {
    // Update existing modal if it exists
    if (this.modals.has(id)) {
      const currentModal = this.modals.get(id)
      this.modals.set(id, { ...currentModal!, isOpen: false })
      this.notify()
    }
  }

  /**
   * Check if a modal is open
   * @param id Modal identifier
   * @returns Boolean indicating if modal is open
   */
  isModalOpen(id: string): boolean {
    // Check if modal exists and is open
    const modal = this.modals.get(id)
    return modal ? modal.isOpen : false
  }
}

// Singleton instance
export const ModalMediator = new ModalMediatorService()
