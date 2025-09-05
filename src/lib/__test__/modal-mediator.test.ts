import { ModalMediator } from '../modal-mediator'

// Reset the singleton state before each test to ensure test isolation
const resetModalMediator = () => {
  // Access private properties through type assertion for testing
  const mediator = ModalMediator as any
  mediator.modals.clear()
  mediator.subscribers.clear()
  mediator.openOrder = []
}

describe('ModalMediatorService', () => {
  beforeEach(() => {
    resetModalMediator()
  })

  describe('Singleton behavior', () => {
    it('should return the same instance when accessed multiple times', () => {
      const instance1 = ModalMediator
      const instance2 = ModalMediator

      expect(instance1).toBe(instance2)
    })
  })

  describe('Initial state', () => {
    it('should start with empty modals, subscribers, and openOrder', () => {
      const mediator = ModalMediator as any

      expect(mediator.modals.size).toBe(0)
      expect(mediator.subscribers.size).toBe(0)
      expect(mediator.openOrder).toEqual([])
    })
  })

  describe('Subscription management', () => {
    describe('subscribe', () => {
      it('should add subscriber to the subscribers set', () => {
        const mockSubscriber = jest.fn()
        const mediator = ModalMediator as any

        ModalMediator.subscribe(mockSubscriber)

        expect(mediator.subscribers.size).toBe(1)
        expect(mediator.subscribers.has(mockSubscriber)).toBe(true)
      })

      it('should immediately notify subscriber with current state', () => {
        const mockSubscriber = jest.fn()

        ModalMediator.subscribe(mockSubscriber)

        expect(mockSubscriber).toHaveBeenCalledTimes(1)
        expect(mockSubscriber).toHaveBeenCalledWith(new Map())
      })

      it('should notify subscriber with existing modal state', () => {
        const mockSubscriber = jest.fn()

        ModalMediator.openModal('test-modal')
        ModalMediator.subscribe(mockSubscriber)

        expect(mockSubscriber).toHaveBeenCalledTimes(1)

        const receivedState = mockSubscriber.mock.calls[0][0] //[first call][first arg]
        expect(receivedState).toBeInstanceOf(Map)
        expect(receivedState.size).toBe(1)
        expect(receivedState.has('test-modal')).toBe(true)
        expect(receivedState.get('test-modal')).toMatchObject({
          id: 'test-modal',
          isOpen: true,
        })
      })

      it('should return unsubscribe function', () => {
        const mockSubscriber = jest.fn()

        const unsubscribe = ModalMediator.subscribe(mockSubscriber)

        expect(typeof unsubscribe).toBe('function')
      })

      it('should allow multiple subscribers', () => {
        const mockSubscriber1 = jest.fn()
        const mockSubscriber2 = jest.fn()

        const mediator = ModalMediator as any

        ModalMediator.subscribe(mockSubscriber1)
        ModalMediator.subscribe(mockSubscriber2)

        expect(mediator.subscribers.size).toBe(2)
        expect(mediator.subscribers.has(mockSubscriber1)).toBe(true)
        expect(mediator.subscribers.has(mockSubscriber2)).toBe(true)
      })
    })

    describe('unsubscribe', () => {
      it('should remove subscriber when unsubscribe function is called', () => {
        const mockSubscriber = jest.fn()
        const mediator = ModalMediator as any

        const unsubscribe = ModalMediator.subscribe(mockSubscriber)

        expect(mediator.subscribers.size).toBe(1)

        unsubscribe()

        expect(mediator.subscribers.size).toBe(0)
        expect(mediator.subscribers.has(mockSubscriber)).toBe(false)
      })

      it('should not affect other subscribers when one unsubscribes', () => {
        const mockSubscriber1 = jest.fn()
        const mockSubscriber2 = jest.fn()
        const mediator = ModalMediator as any

        const unsubscribe1 = ModalMediator.subscribe(mockSubscriber1)
        ModalMediator.subscribe(mockSubscriber2)

        expect(mediator.subscribers.size).toBe(2)

        unsubscribe1()

        expect(mediator.subscribers.size).toBe(1)
        expect(mediator.subscribers.has(mockSubscriber1)).toBe(false)
        expect(mediator.subscribers.has(mockSubscriber2)).toBe(true)
      })

      it('should be safe to call unsubscribe multiple times', () => {
        const mockSubscriber = jest.fn()
        const mediator = ModalMediator as any

        const unsubscribe = ModalMediator.subscribe(mockSubscriber)

        unsubscribe()
        unsubscribe()

        expect(mediator.subscribers.size).toBe(0)
      })
    })
  })

  describe('Modal operations', () => {
    describe('openModal', () => {
      it('should create and open a new modal', () => {
        const modalId = 'test-modal'

        ModalMediator.openModal(modalId)

        expect(ModalMediator.isModalOpen(modalId)).toBe(true)
      })

      it('should update existing modal to open state', () => {
        const modalId = 'test-modal'

        // First open then close
        ModalMediator.openModal(modalId)
        ModalMediator.closeModal(modalId)

        expect(ModalMediator.isModalOpen(modalId)).toBe(false)

        // Open again
        ModalMediator.openModal(modalId)

        expect(ModalMediator.isModalOpen(modalId)).toBe(true)
      })

      it('should handle multiple modals independently', () => {
        const modalId1 = 'modal-1'
        const modalId2 = 'modal-2'

        ModalMediator.openModal(modalId1)
        ModalMediator.openModal(modalId2)

        expect(ModalMediator.isModalOpen(modalId1)).toBe(true)
        expect(ModalMediator.isModalOpen(modalId2)).toBe(true)
      })

      it('should notify subscribers when modal is opened', () => {
        const mockSubscriber = jest.fn()
        const modalId = 'test-modal'

        ModalMediator.subscribe(mockSubscriber)
        mockSubscriber.mockClear() // Clear initial notification

        ModalMediator.openModal(modalId)

        expect(mockSubscriber).toHaveBeenCalledTimes(1)
        const calledWithMap = mockSubscriber.mock.calls[0][0] // First call first argment
        expect(calledWithMap.get(modalId)).toEqual({
          id: modalId,
          isOpen: true,
        })
      })

      it('should add modal to openOrder when opened', () => {
        const modalId = 'test-modal'
        const mediator = ModalMediator as any

        ModalMediator.openModal(modalId)

        expect(mediator.openOrder).toEqual([modalId])
      })

      it('should track multiple modals in openOrder', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'
        const modal3 = 'modal-3'
        const mediator = ModalMediator as any

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)
        ModalMediator.openModal(modal3)

        expect(mediator.openOrder).toEqual([modal1, modal2, modal3])
      })

      it('should move modal to end of openOrder when reopened', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'
        const mediator = ModalMediator as any

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)
        expect(mediator.openOrder).toEqual([modal1, modal2])

        // Reopen modal1 - should move to end
        ModalMediator.openModal(modal1)
        expect(mediator.openOrder).toEqual([modal2, modal1])
      })
    })

    describe('closeModal', () => {
      it('should close an existing modal', () => {
        const modalId = 'test-modal'

        ModalMediator.openModal(modalId)
        expect(ModalMediator.isModalOpen(modalId)).toBe(true)

        ModalMediator.closeModal(modalId)
        expect(ModalMediator.isModalOpen(modalId)).toBe(false)
      })

      it('should not affect non-existent modals', () => {
        const mockSubscriber = jest.fn()
        ModalMediator.subscribe(mockSubscriber)
        mockSubscriber.mockClear()

        ModalMediator.closeModal('non-existent-modal')

        // Should not notify subscribers since no change occurred
        expect(mockSubscriber).not.toHaveBeenCalled()
      })

      it('should preserve modal state structure when closing', () => {
        const modalId = 'test-modal'

        ModalMediator.openModal(modalId)
        ModalMediator.closeModal(modalId)

        const mediator = ModalMediator as any
        const modal = mediator.modals.get(modalId)

        expect(modal).toEqual({
          id: modalId,
          isOpen: false,
        })
      })

      it('should notify subscribers when modal is closed', () => {
        const mockSubscriber = jest.fn()
        const modalId = 'test-modal'

        ModalMediator.openModal(modalId)
        ModalMediator.subscribe(mockSubscriber)
        mockSubscriber.mockClear() // Clear initial notification

        ModalMediator.closeModal(modalId)

        expect(mockSubscriber).toHaveBeenCalledTimes(1)
        const calledWithMap = mockSubscriber.mock.calls[0][0]
        expect(calledWithMap.get(modalId)).toEqual({
          id: modalId,
          isOpen: false,
        })
      })
    })

    describe('isModalOpen', () => {
      it('should return true for open modals', () => {
        const modalId = 'test-modal'

        ModalMediator.openModal(modalId)

        expect(ModalMediator.isModalOpen(modalId)).toBe(true)
      })

      it('should return false for closed modals', () => {
        const modalId = 'test-modal'

        ModalMediator.openModal(modalId)
        ModalMediator.closeModal(modalId)

        expect(ModalMediator.isModalOpen(modalId)).toBe(false)
      })

      it('should return false for non-existent modals', () => {
        expect(ModalMediator.isModalOpen('non-existent-modal')).toBe(false)
      })

      it('should handle empty string modal ID', () => {
        expect(ModalMediator.isModalOpen('')).toBe(false)
      })
    })

    describe('getLastOpenModal', () => {
      it('should return null when no modals are open', () => {
        const mediator = ModalMediator as any

        expect(mediator.getLastOpenModal()).toBeNull()
      })

      it('should return the only open modal', () => {
        const modalId = 'test-modal'
        const mediator = ModalMediator as any

        ModalMediator.openModal(modalId)

        expect(mediator.getLastOpenModal()).toBe(modalId)
      })

      it('should return the most recently opened modal', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'
        const modal3 = 'modal-3'
        const mediator = ModalMediator as any

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)
        ModalMediator.openModal(modal3)

        expect(mediator.getLastOpenModal()).toBe(modal3)
      })

      it('should return the most recently opened modal after one is closed', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'
        const modal3 = 'modal-3'
        const mediator = ModalMediator as any

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)
        ModalMediator.openModal(modal3)

        // Close the most recent one
        ModalMediator.closeModal(modal3)

        expect(mediator.getLastOpenModal()).toBe(modal2)
      })

      it('should return correct modal when middle modal is closed', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'
        const modal3 = 'modal-3'
        const mediator = ModalMediator as any

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)
        ModalMediator.openModal(modal3)

        // Close the middle one
        ModalMediator.closeModal(modal2)

        expect(mediator.getLastOpenModal()).toBe(modal3)
      })

      it('should handle modal reopening correctly', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'
        const mediator = ModalMediator as any

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)
        expect(mediator.getLastOpenModal()).toBe(modal2)

        // Reopen modal1 - should become most recent
        ModalMediator.openModal(modal1)
        expect(mediator.getLastOpenModal()).toBe(modal1)
      })
    })
  })

  describe('Escape key functionality', () => {
    describe('when Escape key is pressed', () => {
      it('should close the most recently opened modal', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)

        expect(ModalMediator.isModalOpen(modal1)).toBe(true)
        expect(ModalMediator.isModalOpen(modal2)).toBe(true)

        // Simulate Escape key press by dispatching event to document
        const escapeEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        document.dispatchEvent(escapeEvent)

        expect(ModalMediator.isModalOpen(modal1)).toBe(true)
        expect(ModalMediator.isModalOpen(modal2)).toBe(false)
      })

      it('should do nothing when no modals are open', () => {
        const mockSubscriber = jest.fn()
        ModalMediator.subscribe(mockSubscriber)
        mockSubscriber.mockClear()

        // Simulate Escape key press
        const escapeEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        document.dispatchEvent(escapeEvent)

        // Should not notify subscribers since no change occurred
        expect(mockSubscriber).not.toHaveBeenCalled()
      })

      it('should close only one modal per key press', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'
        const modal3 = 'modal-3'

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)
        ModalMediator.openModal(modal3)

        // First Escape - closes modal3
        const escapeEvent1 = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        document.dispatchEvent(escapeEvent1)

        expect(ModalMediator.isModalOpen(modal1)).toBe(true)
        expect(ModalMediator.isModalOpen(modal2)).toBe(true)
        expect(ModalMediator.isModalOpen(modal3)).toBe(false)

        // Second Escape - closes modal2
        const escapeEvent2 = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        document.dispatchEvent(escapeEvent2)

        expect(ModalMediator.isModalOpen(modal1)).toBe(true)
        expect(ModalMediator.isModalOpen(modal2)).toBe(false)
        expect(ModalMediator.isModalOpen(modal3)).toBe(false)
      })

      it('should handle modal reopening and close correct modal', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)

        // Reopen modal1 - should become most recent
        ModalMediator.openModal(modal1)

        // Escape should close modal1 (most recent)
        const escapeEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        document.dispatchEvent(escapeEvent)

        expect(ModalMediator.isModalOpen(modal1)).toBe(false)
        expect(ModalMediator.isModalOpen(modal2)).toBe(true)
      })

      it('should notify subscribers when modal is closed via Escape', () => {
        const mockSubscriber = jest.fn()
        const modalId = 'test-modal'

        ModalMediator.openModal(modalId)
        ModalMediator.subscribe(mockSubscriber)
        mockSubscriber.mockClear()

        // Simulate Escape key press
        const escapeEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        document.dispatchEvent(escapeEvent)

        expect(mockSubscriber).toHaveBeenCalledTimes(1)
        const calledWithMap = mockSubscriber.mock.calls[0][0]
        expect(calledWithMap.get(modalId)).toEqual({
          id: modalId,
          isOpen: false,
        })
      })
    })

    describe('when other keys are pressed', () => {
      it('should not close modals on other key presses', () => {
        const modalId = 'test-modal'
        ModalMediator.openModal(modalId)

        const nonEscapeKeys = ['Enter', 'Space', 'Tab', 'ArrowUp', 'a', '1']

        nonEscapeKeys.forEach(key => {
          const keyEvent = new KeyboardEvent('keydown', { key, bubbles: true })
          document.dispatchEvent(keyEvent)

          expect(ModalMediator.isModalOpen(modalId)).toBe(true)
        })
      })
    })
  })

  describe('Notification system', () => {
    describe('when notifying subscribers', () => {
      it('should provide immutable copy of modal state to subscribers', () => {
        const mockSubscriber = jest.fn()
        const modalId = 'test-modal'

        ModalMediator.subscribe(mockSubscriber)
        ModalMediator.openModal(modalId)

        const receivedMap = mockSubscriber.mock.calls[1][0] // Second call (first is initial)
        const mediator = ModalMediator as any

        // Maps should have same content but be different instances
        expect(receivedMap).toEqual(mediator.modals)
        expect(receivedMap).not.toBe(mediator.modals)
      })

      it('should notify all subscribers when modal state changes', () => {
        const mockSubscriber1 = jest.fn()
        const mockSubscriber2 = jest.fn()
        const modalId = 'test-modal'

        ModalMediator.subscribe(mockSubscriber1)
        ModalMediator.subscribe(mockSubscriber2)

        // Clear initial notifications
        mockSubscriber1.mockClear()
        mockSubscriber2.mockClear()

        ModalMediator.openModal(modalId)

        expect(mockSubscriber1).toHaveBeenCalledTimes(1)
        expect(mockSubscriber2).toHaveBeenCalledTimes(1)

        const map1 = mockSubscriber1.mock.calls[0][0]
        const map2 = mockSubscriber2.mock.calls[0][0]

        expect(map1.get(modalId)).toEqual({ id: modalId, isOpen: true })
        expect(map2.get(modalId)).toEqual({ id: modalId, isOpen: true })
      })

      it('should propagate subscriber errors during subscription', () => {
        const errorSubscriber = jest.fn().mockImplementation(() => {
          throw new Error('Subscriber error')
        })

        // The error should propagate during subscription (immediate notification)
        expect(() => {
          ModalMediator.subscribe(errorSubscriber)
        }).toThrow('Subscriber error')

        expect(errorSubscriber).toHaveBeenCalled()
      })

      it('should propagate subscriber errors during notification', () => {
        let shouldThrow = false
        const conditionalErrorSubscriber = jest.fn().mockImplementation(() => {
          if (shouldThrow) {
            throw new Error('Subscriber error during notification')
          }
        })

        // Subscribe without error
        ModalMediator.subscribe(conditionalErrorSubscriber)

        // Enable error for next call
        shouldThrow = true

        // The error should propagate during modal operation notification
        expect(() => {
          ModalMediator.openModal('test-modal')
        }).toThrow('Subscriber error during notification')
      })
    })
  })

  describe('Complex scenarios', () => {
    describe('when managing multiple modals simultaneously', () => {
      it('should handle multiple modals with different states', () => {
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'
        const modal3 = 'modal-3'

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)
        ModalMediator.closeModal(modal1)
        ModalMediator.openModal(modal3)

        expect(ModalMediator.isModalOpen(modal1)).toBe(false)
        expect(ModalMediator.isModalOpen(modal2)).toBe(true)
        expect(ModalMediator.isModalOpen(modal3)).toBe(true)
      })

      it('should notify subscribers with complete modal state', () => {
        const mockSubscriber = jest.fn()
        const modal1 = 'modal-1'
        const modal2 = 'modal-2'

        ModalMediator.subscribe(mockSubscriber)
        mockSubscriber.mockClear()

        ModalMediator.openModal(modal1)
        ModalMediator.openModal(modal2)

        // Should have been called twice (once for each modal operation)
        expect(mockSubscriber).toHaveBeenCalledTimes(2)

        // Check the final state includes both modals
        const finalMap = mockSubscriber.mock.calls[1][0]
        expect(finalMap.size).toBe(2)
        expect(finalMap.get(modal1)).toEqual({ id: modal1, isOpen: true })
        expect(finalMap.get(modal2)).toEqual({ id: modal2, isOpen: true })
      })
    })

    describe('when handling rapid state changes', () => {
      it('should handle rapid open/close operations correctly', () => {
        const modalId = 'rapid-modal'

        // Rapid operations
        ModalMediator.openModal(modalId)
        ModalMediator.closeModal(modalId)
        ModalMediator.openModal(modalId)
        ModalMediator.closeModal(modalId)
        ModalMediator.openModal(modalId)

        expect(ModalMediator.isModalOpen(modalId)).toBe(true)
      })

      it('should notify subscribers for each state change', () => {
        const mockSubscriber = jest.fn()
        const modalId = 'rapid-modal'

        ModalMediator.subscribe(mockSubscriber)
        mockSubscriber.mockClear()

        ModalMediator.openModal(modalId)
        ModalMediator.closeModal(modalId)
        ModalMediator.openModal(modalId)

        expect(mockSubscriber).toHaveBeenCalledTimes(3)
      })
    })

    describe('when dealing with special modal IDs', () => {
      it('should handle modal IDs with special characters', () => {
        const specialIds = [
          'modal-with-dashes',
          'modal_with_underscores',
          'modal.with.dots',
          'modal with spaces',
          'modal@with#special$chars',
          '123-numeric-modal',
        ]

        specialIds.forEach(id => {
          ModalMediator.openModal(id)
          expect(ModalMediator.isModalOpen(id)).toBe(true)
          ModalMediator.closeModal(id)
          expect(ModalMediator.isModalOpen(id)).toBe(false)
        })
      })

      it('should handle very long modal IDs', () => {
        const longId = 'a'.repeat(1000)

        ModalMediator.openModal(longId)
        expect(ModalMediator.isModalOpen(longId)).toBe(true)
      })
    })
  })

  describe('Memory management', () => {
    describe('when subscribers are removed', () => {
      it('should not retain references to unsubscribed functions', () => {
        const mockSubscriber = jest.fn()
        const mediator = ModalMediator as any

        const unsubscribe = ModalMediator.subscribe(mockSubscriber)

        expect(mediator.subscribers.has(mockSubscriber)).toBe(true)

        unsubscribe()

        expect(mediator.subscribers.has(mockSubscriber)).toBe(false)
      })
    })

    describe('when modals accumulate over time', () => {
      it('should maintain modal history for closed modals', () => {
        const modalIds = Array.from({ length: 100 }, (_, i) => `modal-${i}`)

        // Open and close many modals
        modalIds.forEach(id => {
          ModalMediator.openModal(id)
          ModalMediator.closeModal(id)
        })

        const mediator = ModalMediator as any

        // All modals should be retained in memory (even if closed)
        expect(mediator.modals.size).toBe(100)

        // All should be closed
        modalIds.forEach(id => {
          expect(ModalMediator.isModalOpen(id)).toBe(false)
        })
      })
    })
  })
})
