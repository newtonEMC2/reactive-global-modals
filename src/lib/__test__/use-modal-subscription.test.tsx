import { renderHook, act } from '@testing-library/react'
import { ModalMediator } from '../modal-mediator'
import { useModalSubscription } from '../use-modal-subscription'

// Mock the ModalMediator to control its behavior in tests
jest.mock('../modal-mediator', () => ({
  ModalMediator: {
    subscribe: jest.fn(),
    openModal: jest.fn(),
    closeModal: jest.fn(),
    isModalOpen: jest.fn(),
  },
}))

describe('useModalSubscription', () => {
  const modalId = 'test-modal'
  let subscribeCallback: (
    modals: Map<string, { id: string; isOpen: boolean }>
  ) => void
  const unsubscribeMock = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()

    // Mock the subscribe method to capture the callback and return unsubscribe function
    ;(ModalMediator.subscribe as jest.Mock).mockImplementation(callback => {
      subscribeCallback = callback
      return unsubscribeMock
    })
  })

  describe('Initial state behavior', () => {
    describe('when modal does not exist', () => {
      it('should initialize with false when defaultOpen is false', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() =>
          useModalSubscription(modalId, false)
        )

        expect(result.current.isOpen).toBe(false)
        expect(ModalMediator.isModalOpen).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.openModal).not.toHaveBeenCalled()
      })

      it('should initialize with false when defaultOpen is not provided', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        expect(result.current.isOpen).toBe(false)
        expect(ModalMediator.isModalOpen).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.openModal).not.toHaveBeenCalled()
      })

      it('should initialize with true and open modal when defaultOpen is true', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId, true))

        expect(result.current.isOpen).toBe(true)
        expect(ModalMediator.isModalOpen).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.openModal).toHaveBeenCalledWith(modalId)
      })
    })

    describe('when modal already exists', () => {
      it('should initialize with current modal state when modal is open', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(true)

        const { result } = renderHook(() =>
          useModalSubscription(modalId, false)
        )

        expect(result.current.isOpen).toBe(true)
        expect(ModalMediator.isModalOpen).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.openModal).not.toHaveBeenCalled()
      })

      it('should initialize with true when modal is closed but defaultOpen is true', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId, true))

        // When modal doesn't exist (!currentState) and defaultOpen is true, should open it
        expect(result.current.isOpen).toBe(true)
        expect(ModalMediator.isModalOpen).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.openModal).toHaveBeenCalledWith(modalId)
      })

      it('should not override existing open modal with defaultOpen=false', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(true)

        const { result } = renderHook(() =>
          useModalSubscription(modalId, false)
        )

        expect(result.current.isOpen).toBe(true)
        expect(ModalMediator.openModal).not.toHaveBeenCalled()
      })
    })
  })

  describe('Subscription lifecycle', () => {
    describe('when component mounts', () => {
      it('should subscribe to ModalMediator', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        renderHook(() => useModalSubscription(modalId))

        expect(ModalMediator.subscribe).toHaveBeenCalledTimes(1)
        expect(
          typeof (ModalMediator.subscribe as jest.Mock).mock.calls[0][0]
        ).toBe('function')
      })

      it('should subscribe with correct callback function', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        // Verify callback is working by simulating notification
        const modalMap = new Map()
        modalMap.set(modalId, { id: modalId, isOpen: true })

        act(() => {
          subscribeCallback(modalMap)
        })

        expect(result.current.isOpen).toBe(true)
      })
    })

    describe('when component unmounts', () => {
      it('should unsubscribe from ModalMediator', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { unmount } = renderHook(() => useModalSubscription(modalId))

        unmount()

        expect(unsubscribeMock).toHaveBeenCalledTimes(1)
      })
    })

    describe('when modalId changes', () => {
      it('should unsubscribe from old modalId and subscribe to new one', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { rerender } = renderHook(({ id }) => useModalSubscription(id), {
          initialProps: { id: 'modal-1' },
        })

        expect(ModalMediator.subscribe).toHaveBeenCalledTimes(1)

        // Change modalId
        rerender({ id: 'modal-2' })

        // Should unsubscribe from old and subscribe to new
        expect(unsubscribeMock).toHaveBeenCalledTimes(1)
        expect(ModalMediator.subscribe).toHaveBeenCalledTimes(2)
      })

      it('should create new subscription for new modalId but not re-check initial state', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result, rerender } = renderHook(
          ({ id }) => useModalSubscription(id),
          { initialProps: { id: 'modal-1' } }
        )

        expect(result.current.isOpen).toBe(false)
        expect(ModalMediator.isModalOpen).toHaveBeenCalledWith('modal-1')

        // Reset mock to track calls for the second modal
        ;(ModalMediator.isModalOpen as jest.Mock).mockClear()

        rerender({ id: 'modal-2' })

        // The useState initializer only runs on first render, not on re-renders
        // So isModalOpen should not be called again when modalId changes
        expect(ModalMediator.isModalOpen).not.toHaveBeenCalled()

        // But the subscription should change to the new modalId
        expect(ModalMediator.subscribe).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('State updates from mediator', () => {
    describe('when receiving modal state updates', () => {
      it('should update isOpen to true when modal is opened', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        expect(result.current.isOpen).toBe(false)

        // Simulate modal being opened
        const modalMap = new Map()
        modalMap.set(modalId, { id: modalId, isOpen: true })

        act(() => {
          subscribeCallback(modalMap)
        })

        expect(result.current.isOpen).toBe(true)
      })

      it('should update isOpen to false when modal is closed', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(true)

        const { result } = renderHook(() => useModalSubscription(modalId))

        expect(result.current.isOpen).toBe(true)

        // Simulate modal being closed
        const modalMap = new Map()
        modalMap.set(modalId, { id: modalId, isOpen: false })

        act(() => {
          subscribeCallback(modalMap)
        })

        expect(result.current.isOpen).toBe(false)
      })

      it('should set isOpen to false when modal is removed from map', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(true)

        const { result } = renderHook(() => useModalSubscription(modalId))

        expect(result.current.isOpen).toBe(true)

        // Simulate modal being removed (empty map)
        const modalMap = new Map()

        act(() => {
          subscribeCallback(modalMap)
        })

        expect(result.current.isOpen).toBe(false)
      })

      it('should ignore updates for other modals', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        expect(result.current.isOpen).toBe(false)

        // Simulate update for different modal
        const modalMap = new Map()
        modalMap.set('other-modal', { id: 'other-modal', isOpen: true })

        act(() => {
          subscribeCallback(modalMap)
        })

        // Should remain false since our modal wasn't in the update
        expect(result.current.isOpen).toBe(false)
      })

      it('should handle multiple modals in the same update', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        expect(result.current.isOpen).toBe(false)

        // Simulate update with multiple modals
        const modalMap = new Map()
        modalMap.set('other-modal', { id: 'other-modal', isOpen: true })
        modalMap.set(modalId, { id: modalId, isOpen: true })
        modalMap.set('another-modal', { id: 'another-modal', isOpen: false })

        act(() => {
          subscribeCallback(modalMap)
        })

        expect(result.current.isOpen).toBe(true)
      })
    })
  })

  describe('Modal operation callbacks', () => {
    describe('openModal callback', () => {
      it('should call ModalMediator.openModal with correct modalId', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        act(() => {
          result.current.openModal()
        })

        expect(ModalMediator.openModal).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.openModal).toHaveBeenCalledTimes(1)
      })

      it('should work multiple times', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        act(() => {
          result.current.openModal()
          result.current.openModal()
        })

        expect(ModalMediator.openModal).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.openModal).toHaveBeenCalledTimes(2)
      })
    })

    describe('closeModal callback', () => {
      it('should call ModalMediator.closeModal with correct modalId', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        act(() => {
          result.current.closeModal()
        })

        expect(ModalMediator.closeModal).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.closeModal).toHaveBeenCalledTimes(1)
      })

      it('should work multiple times', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        act(() => {
          result.current.closeModal()
          result.current.closeModal()
        })

        expect(ModalMediator.closeModal).toHaveBeenCalledWith(modalId)
        expect(ModalMediator.closeModal).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Callback memoization and re-renders', () => {
    describe('when component re-renders with same modalId', () => {
      it('should return same function references for callbacks', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result, rerender } = renderHook(() =>
          useModalSubscription(modalId)
        )

        const initialOpenModal = result.current.openModal
        const initialCloseModal = result.current.closeModal

        // Force re-render
        rerender()

        // Functions should be the same references (memoized)
        expect(result.current.openModal).toBe(initialOpenModal)
        expect(result.current.closeModal).toBe(initialCloseModal)
      })

      it('should not cause unnecessary re-subscriptions', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { rerender } = renderHook(() => useModalSubscription(modalId))

        expect(ModalMediator.subscribe).toHaveBeenCalledTimes(1)

        // Force re-render with same modalId
        rerender()

        // Should not subscribe again
        expect(ModalMediator.subscribe).toHaveBeenCalledTimes(1)
        expect(unsubscribeMock).not.toHaveBeenCalled()
      })
    })

    describe('when modalId changes', () => {
      it('should return new function references for callbacks', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result, rerender } = renderHook(
          ({ id }) => useModalSubscription(id),
          { initialProps: { id: 'modal-1' } }
        )

        const initialOpenModal = result.current.openModal
        const initialCloseModal = result.current.closeModal

        // Change modalId
        rerender({ id: 'modal-2' })

        // Functions should be new references
        expect(result.current.openModal).not.toBe(initialOpenModal)
        expect(result.current.closeModal).not.toBe(initialCloseModal)
      })

      it('should call correct modalId after change', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result, rerender } = renderHook(
          ({ id }) => useModalSubscription(id),
          { initialProps: { id: 'modal-1' } }
        )

        // Change modalId
        rerender({ id: 'modal-2' })

        act(() => {
          result.current.openModal()
        })

        expect(ModalMediator.openModal).toHaveBeenCalledWith('modal-2')
      })
    })
  })

  describe('Complex scenarios', () => {
    describe('when using multiple hooks with same modalId', () => {
      it('should both receive the same state updates', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result: result1 } = renderHook(() =>
          useModalSubscription(modalId)
        )
        const { result: result2 } = renderHook(() =>
          useModalSubscription(modalId)
        )

        expect(result1.current.isOpen).toBe(false)
        expect(result2.current.isOpen).toBe(false)

        // Both should subscribe
        expect(ModalMediator.subscribe).toHaveBeenCalledTimes(2)

        // Simulate modal opening - both callbacks should be called
        const modalMap = new Map()
        modalMap.set(modalId, { id: modalId, isOpen: true })

        act(() => {
          // Call both callbacks (simulating mediator notifying all subscribers)
          ;(ModalMediator.subscribe as jest.Mock).mock.calls.forEach(
            ([callback]: [any]) => {
              callback(modalMap)
            }
          )
        })

        expect(result1.current.isOpen).toBe(true)
        expect(result2.current.isOpen).toBe(true)
      })
    })

    describe('when using hooks with different modalIds', () => {
      it('should maintain independent state', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result: result1 } = renderHook(() =>
          useModalSubscription('modal-1')
        )
        const { result: result2 } = renderHook(() =>
          useModalSubscription('modal-2')
        )

        expect(result1.current.isOpen).toBe(false)
        expect(result2.current.isOpen).toBe(false)

        // Simulate only modal-1 opening
        const modalMap = new Map()
        modalMap.set('modal-1', { id: 'modal-1', isOpen: true })

        act(() => {
          ;(ModalMediator.subscribe as jest.Mock).mock.calls.forEach(
            ([callback]: [any]) => {
              callback(modalMap)
            }
          )
        })

        expect(result1.current.isOpen).toBe(true)
        expect(result2.current.isOpen).toBe(false) // Should remain false
      })
    })
  })

  describe('Edge cases and error handling', () => {
    describe('when modalId is empty or invalid', () => {
      it('should handle empty string modalId', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(''))

        expect(result.current.isOpen).toBe(false)
        expect(ModalMediator.isModalOpen).toHaveBeenCalledWith('')

        act(() => {
          result.current.openModal()
        })

        expect(ModalMediator.openModal).toHaveBeenCalledWith('')
      })

      it('should handle special characters in modalId', () => {
        const specialModalId = 'modal@#$%^&*()_+{}[]'
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() =>
          useModalSubscription(specialModalId)
        )

        expect(ModalMediator.isModalOpen).toHaveBeenCalledWith(specialModalId)

        act(() => {
          result.current.openModal()
        })

        expect(ModalMediator.openModal).toHaveBeenCalledWith(specialModalId)
      })
    })

    describe('when defaultOpen parameter changes', () => {
      it('should not affect behavior after initialization', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result, rerender } = renderHook(
          ({ defaultOpen }) => useModalSubscription(modalId, defaultOpen),
          { initialProps: { defaultOpen: false } }
        )

        expect(result.current.isOpen).toBe(false)
        expect(ModalMediator.openModal).not.toHaveBeenCalled()

        // Change defaultOpen to true (should not affect already initialized hook)
        rerender({ defaultOpen: true })

        expect(result.current.isOpen).toBe(false)
        expect(ModalMediator.openModal).not.toHaveBeenCalled()
      })
    })

    describe('when subscription callback receives invalid data', () => {
      it('should handle null/undefined modal in map gracefully', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        // Simulate invalid modal data
        const modalMap = new Map()
        modalMap.set(modalId, null as any)

        act(() => {
          subscribeCallback(modalMap)
        })

        // Should default to false when modal data is invalid
        expect(result.current.isOpen).toBe(false)
      })

      it('should handle modal with missing isOpen property', () => {
        ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

        const { result } = renderHook(() => useModalSubscription(modalId))

        // Simulate modal without isOpen property
        const modalMap = new Map()
        modalMap.set(modalId, { id: modalId } as any)

        act(() => {
          subscribeCallback(modalMap)
        })

        // Should be undefined when isOpen is missing (actual behavior: modal.isOpen)
        expect(result.current.isOpen).toBeUndefined()
      })
    })
  })

  describe('Return value structure', () => {
    it('should return object with correct properties', () => {
      ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

      const { result } = renderHook(() => useModalSubscription(modalId))

      expect(result.current).toHaveProperty('isOpen')
      expect(result.current).toHaveProperty('openModal')
      expect(result.current).toHaveProperty('closeModal')

      expect(typeof result.current.isOpen).toBe('boolean')
      expect(typeof result.current.openModal).toBe('function')
      expect(typeof result.current.closeModal).toBe('function')
    })

    it('should have consistent return value structure across re-renders', () => {
      ;(ModalMediator.isModalOpen as jest.Mock).mockReturnValue(false)

      const { result, rerender } = renderHook(() =>
        useModalSubscription(modalId)
      )

      const initialKeys = Object.keys(result.current)

      rerender()

      const afterRerenderKeys = Object.keys(result.current)

      expect(afterRerenderKeys).toEqual(initialKeys)
    })
  })
})
