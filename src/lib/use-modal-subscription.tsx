import { useState, useEffect, useCallback } from 'react'
import { ModalMediator } from './modal-mediator'

/**
 * Hook for a component to subscribe to modal state changes
 * @param modalId The ID of the modal to track
 * @param defaultOpen Whether the modal should be open by default
 * @returns An object with the modal's open state and methods to control it
 */
export const useModalSubscription = (modalId: string, defaultOpen = false) => {
  const [isOpen, setIsOpen] = useState(() => {
    const currentState = ModalMediator.isModalOpen(modalId)
    // If modal doesn't exist yet and defaultOpen is true, initialize it as open
    if (!currentState && defaultOpen) {
      ModalMediator.openModal(modalId)
      return true
    }
    return currentState
  })

  useEffect(() => {
    // Subscribe to changes from the mediator
    const unsubscribe = ModalMediator.subscribe(modals => {
      // Get modal state from map
      const modal = modals.get(modalId)
      setIsOpen(modal ? modal.isOpen : false)
    })

    // Clean up subscription when component unmounts
    return unsubscribe
  }, [modalId])

  // Memoize callback functions to prevent unnecessary re-renders
  const openModal = useCallback(() => {
    ModalMediator.openModal(modalId)
  }, [modalId])

  const closeModal = useCallback(() => {
    ModalMediator.closeModal(modalId)
  }, [modalId])

  return {
    isOpen,
    openModal,
    closeModal,
  }
}
