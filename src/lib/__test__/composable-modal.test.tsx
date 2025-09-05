import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock CSS modules
jest.mock('../composable-modal.module.css', () => ({
  modalContainer: 'modalContainer',
  modalBackdrop: 'modalBackdrop',
}))

import { ComposableModal } from '../composable-modal'

// Mock the ModalMediator to control its behavior in tests
jest.mock('../modal-mediator', () => ({
  ModalMediator: {
    subscribe: jest.fn(),
    openModal: jest.fn(),
    closeModal: jest.fn(),
    isModalOpen: jest.fn(),
  },
}))

const mockModalMediator = require('../modal-mediator').ModalMediator

// Mock the useModalSubscription hook
jest.mock('../use-modal-subscription', () => ({
  useModalSubscription: jest.fn(),
}))

const mockUseModalSubscription = require('../use-modal-subscription')
  .useModalSubscription as jest.Mock

describe('ComposableModal', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    // Default mock implementation for useModalSubscription
    mockUseModalSubscription.mockReturnValue({
      isOpen: false,
      openModal: jest.fn(),
      closeModal: jest.fn(),
    })
  })

  describe('ModalComponent', () => {
    describe('when modal is closed', () => {
      it('should not render when isOpen is false', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: false,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal id="test-modal">
            <div data-testid="modal-content">Modal Content</div>
          </ComposableModal>
        )

        expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
      })
    })

    describe('when modal is open', () => {
      it('should render modal content when isOpen is true', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal id="test-modal">
            <div data-testid="modal-content">Modal Content</div>
          </ComposableModal>
        )

        expect(screen.getByTestId('modal-content')).toBeInTheDocument()
      })

      it('should apply custom className', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal id="test-modal" className="custom-modal">
            <div data-testid="modal-content">Modal Content</div>
          </ComposableModal>
        )

        const modalContainer = screen.getByTestId('modal-content').parentElement
        expect(modalContainer).toHaveClass('custom-modal')
      })

      it('should prevent event propagation when clicked', () => {
        const mockCloseModal = jest.fn()
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: mockCloseModal,
        })

        render(
          <ComposableModal id="test-modal">
            <div data-testid="modal-content">Modal Content</div>
          </ComposableModal>
        )

        const modalContainer =
          screen.getByTestId('modal-content').parentElement!
        fireEvent.click(modalContainer)

        // Event propagation should be stopped, so closeModal should not be called
        expect(mockCloseModal).not.toHaveBeenCalled()
      })
    })

    describe('useModalSubscription integration', () => {
      it('should call useModalSubscription with correct parameters', () => {
        render(
          <ComposableModal id="test-modal" defaultOpen={true}>
            <div>Modal Content</div>
          </ComposableModal>
        )

        expect(mockUseModalSubscription).toHaveBeenCalledWith(
          'test-modal',
          true
        )
      })

      it('should use false as default for defaultOpen', () => {
        render(
          <ComposableModal id="test-modal">
            <div>Modal Content</div>
          </ComposableModal>
        )

        expect(mockUseModalSubscription).toHaveBeenCalledWith(
          'test-modal',
          undefined
        )
      })
    })
  })

  describe('ModalBackdrop', () => {
    const TestModal = ({
      modalId = 'test-modal',
      modalOpen = false,
      customOnClick = undefined as any,
    }) => {
      mockUseModalSubscription.mockReturnValue({
        isOpen: modalOpen,
        openModal: jest.fn(),
        closeModal: jest.fn(),
      })

      return (
        <ComposableModal.Backdrop onClick={customOnClick}>
          <ComposableModal id={modalId}>
            <div data-testid="modal-content">Modal Content</div>
          </ComposableModal>
        </ComposableModal.Backdrop>
      )
    }

    describe('when modal is closed', () => {
      it('should not render when wrapped modal is closed', () => {
        render(<TestModal modalOpen={false} />)

        expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
      })
    })

    describe('when modal is open', () => {
      it('should render backdrop and modal when wrapped modal is open', () => {
        render(<TestModal modalOpen={true} />)

        expect(screen.getByTestId('modal-content')).toBeInTheDocument()

        // Check that backdrop wrapper exists
        const modalContent = screen.getByTestId('modal-content')
        const backdrop = modalContent.closest('[class*="modalBackdrop"]')
        expect(backdrop).toBeInTheDocument()
      })

      it('should apply custom className to backdrop', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal.Backdrop className="custom-backdrop">
            <ComposableModal id="test-modal">
              <div data-testid="modal-content">Modal Content</div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        const modalContent = screen.getByTestId('modal-content')
        const backdrop = modalContent.closest('[class*="modalBackdrop"]')
        expect(backdrop).toHaveClass('custom-backdrop')
      })
    })

    describe('default onClick behavior', () => {
      it('should close modal when backdrop is clicked (no custom onClick)', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal.Backdrop>
            <ComposableModal id="test-modal">
              <div data-testid="modal-content">Modal Content</div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        const modalContent = screen.getByTestId('modal-content')
        const backdrop = modalContent.closest('[class*="modalBackdrop"]')!

        // Click directly on backdrop
        fireEvent.click(backdrop)

        expect(mockModalMediator.closeModal).toHaveBeenCalledWith('test-modal')
      })

      it('should not close modal when modal content is clicked', () => {
        const mockCloseModal = jest.fn()
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: mockCloseModal,
        })

        render(
          <ComposableModal.Backdrop>
            <ComposableModal id="test-modal">
              <div data-testid="modal-content">Modal Content</div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        const modalContent = screen.getByTestId('modal-content')

        // Click on modal content (not backdrop)
        fireEvent.click(modalContent)

        expect(mockCloseModal).not.toHaveBeenCalled()
      })
    })

    describe('custom onClick behavior', () => {
      it('should call custom onClick when provided', () => {
        const mockCustomClick = jest.fn()
        const mockCloseModal = jest.fn()
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: mockCloseModal,
        })

        render(
          <ComposableModal.Backdrop onClick={mockCustomClick}>
            <ComposableModal id="test-modal">
              <div data-testid="modal-content">Modal Content</div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        const modalContent = screen.getByTestId('modal-content')
        const backdrop = modalContent.closest('[class*="modalBackdrop"]')!

        // Click directly on backdrop
        fireEvent.click(backdrop)

        expect(mockCustomClick).toHaveBeenCalledTimes(1)
        expect(mockCloseModal).not.toHaveBeenCalled()
      })

      it('should pass click event to custom onClick handler', () => {
        const mockCustomClick = jest.fn()
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal.Backdrop onClick={mockCustomClick}>
            <ComposableModal id="test-modal">
              <div data-testid="modal-content">Modal Content</div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        const modalContent = screen.getByTestId('modal-content')
        const backdrop = modalContent.closest('[class*="modalBackdrop"]')!

        fireEvent.click(backdrop)

        expect(mockCustomClick).toHaveBeenCalledWith(expect.any(Object))

        // Verify it's a proper click event
        const clickEvent = mockCustomClick.mock.calls[0][0]
        expect(clickEvent.type).toBe('click')
      })
    })

    describe('modal detection and synchronization', () => {
      it('should extract modal ID from ComposableModal child', () => {
        render(<TestModal modalId="custom-modal" modalOpen={true} />)

        expect(mockUseModalSubscription).toHaveBeenCalledWith(
          'custom-modal',
          undefined
        )
      })

      it('should handle defaultOpen from ComposableModal child', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal.Backdrop>
            <ComposableModal id="test-modal" defaultOpen={true}>
              <div data-testid="modal-content">Modal Content</div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        expect(mockUseModalSubscription).toHaveBeenCalledWith(
          'test-modal',
          true
        )
      })

      it('should not render when no ComposableModal child is found', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal.Backdrop>
            <div data-testid="not-a-modal">Not a modal</div>
          </ComposableModal.Backdrop>
        )

        expect(screen.queryByTestId('not-a-modal')).not.toBeInTheDocument()
      })

      it('should handle multiple children and find first ComposableModal', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal.Backdrop>
            <div>Some other content</div>
            <ComposableModal id="first-modal">
              <div data-testid="first-modal-content">First Modal</div>
            </ComposableModal>
            <ComposableModal id="second-modal">
              <div data-testid="second-modal-content">Second Modal</div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        // Should use the first ComposableModal found
        expect(mockUseModalSubscription).toHaveBeenCalledWith(
          'first-modal',
          undefined
        )
        expect(screen.getByTestId('first-modal-content')).toBeInTheDocument()
      })
    })

    describe('edge cases', () => {
      it('should handle missing modal ID gracefully', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: false,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal.Backdrop>
            <ComposableModal id="">
              <div data-testid="modal-content">Modal Content</div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        expect(mockUseModalSubscription).toHaveBeenCalledWith('', undefined)
        expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
      })

      it('should handle click events with different target/currentTarget', () => {
        const mockCloseModal = jest.fn()
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: mockCloseModal,
        })

        render(
          <ComposableModal.Backdrop>
            <ComposableModal id="test-modal">
              <div data-testid="modal-content">
                <button data-testid="inner-button">Inner Button</button>
              </div>
            </ComposableModal>
          </ComposableModal.Backdrop>
        )

        const innerButton = screen.getByTestId('inner-button')

        // Click on inner element - should not close modal
        fireEvent.click(innerButton)

        expect(mockCloseModal).not.toHaveBeenCalled()
      })
    })
  })

  describe('Sub-components', () => {
    describe('Title', () => {
      it('should render title content', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal id="test-modal">
            <ComposableModal.Title>
              <h2 data-testid="modal-title">Test Title</h2>
            </ComposableModal.Title>
          </ComposableModal>
        )

        expect(screen.getByTestId('modal-title')).toBeInTheDocument()
        expect(screen.getByText('Test Title')).toBeInTheDocument()
      })
    })

    describe('Content', () => {
      it('should render content', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal id="test-modal">
            <ComposableModal.Content>
              <p data-testid="modal-content">Test content</p>
            </ComposableModal.Content>
          </ComposableModal>
        )

        expect(screen.getByTestId('modal-content')).toBeInTheDocument()
        expect(screen.getByText('Test content')).toBeInTheDocument()
      })
    })

    describe('Actions', () => {
      it('should render action buttons', () => {
        mockUseModalSubscription.mockReturnValue({
          isOpen: true,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        })

        render(
          <ComposableModal id="test-modal">
            <ComposableModal.Actions>
              <button data-testid="action-button">Action</button>
            </ComposableModal.Actions>
          </ComposableModal>
        )

        expect(screen.getByTestId('action-button')).toBeInTheDocument()
        expect(screen.getByText('Action')).toBeInTheDocument()
      })
    })
  })

  describe('Component composition', () => {
    it('should render complete modal with all sub-components', () => {
      mockUseModalSubscription.mockReturnValue({
        isOpen: true,
        openModal: jest.fn(),
        closeModal: jest.fn(),
      })

      render(
        <ComposableModal.Backdrop>
          <ComposableModal id="complete-modal" className="test-modal">
            <ComposableModal.Title className="test-title">
              <h2 data-testid="modal-title">Complete Modal</h2>
            </ComposableModal.Title>
            <ComposableModal.Content className="test-content">
              <p data-testid="modal-text">This is a complete modal example.</p>
            </ComposableModal.Content>
            <ComposableModal.Actions className="test-actions">
              <button data-testid="cancel-button">Cancel</button>
              <button data-testid="confirm-button">Confirm</button>
            </ComposableModal.Actions>
          </ComposableModal>
        </ComposableModal.Backdrop>
      )

      expect(screen.getByTestId('modal-title')).toBeInTheDocument()
      expect(screen.getByTestId('modal-text')).toBeInTheDocument()
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
      expect(screen.getByTestId('confirm-button')).toBeInTheDocument()
    })
  })
})
