import React from 'react'
import { ComposableModal } from './composable-modal'
import { ModalMediator } from './modal-mediator'
import './example.css' // External styling

export const Modal: React.FC = () => {
  const handleCloseSuccess = () => {
    ModalMediator.closeModal('success-modal')
  }

  const handleCloseWarning = () => {
    ModalMediator.closeModal('warning-modal')
  }

  const openModals = () => {
    // ModalMediator.openModal('default-modal')
    ModalMediator.openModal('success-modal')
    ModalMediator.openModal('warning-modal')
  }

  return (
    <>
      {/* Button to open all modals for demonstration */}
      <button onClick={openModals} style={{ margin: '20px', padding: '10px' }}>
        Open All Modals
      </button>

      {/* Default Modal */}
      {/* <ComposableModal id="default-modal" className="default-theme">
        <ComposableModal.Title className="default-title">
          <h2>Default Modal</h2>
        </ComposableModal.Title>
        <ComposableModal.Content className="default-content">
          <p>This is the default styled modal.</p>
        </ComposableModal.Content>
        <ComposableModal.Actions className="default-actions">
          <button className="btn btn-secondary" onClick={handleCloseDefault}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCloseDefault}>
            OK
          </button>
        </ComposableModal.Actions>
      </ComposableModal> */}

      {/* Success Modal - uses default backdrop close behavior */}
      <ComposableModal.Backdrop className="success-backdrop">
        <ComposableModal id="success-modal" className="success-theme">
          <ComposableModal.Title className="success-title">
            <h2>Success!</h2>
          </ComposableModal.Title>
          <ComposableModal.Content className="success-content">
            <p>Operation completed successfully!</p>
          </ComposableModal.Content>
          <ComposableModal.Actions className="success-actions">
            <button className="btn btn-success" onClick={handleCloseSuccess}>
              Great!
            </button>
          </ComposableModal.Actions>
        </ComposableModal>
      </ComposableModal.Backdrop>

      {/* Warning Modal - uses custom backdrop click handler */}
      <ComposableModal.Backdrop
        className="warning-backdrop"
        onClick={handleCloseWarning}
      >
        <ComposableModal id="warning-modal" className="warning-theme">
          <ComposableModal.Title className="warning-title">
            <h2>⚠️ Warning</h2>
          </ComposableModal.Title>
          <ComposableModal.Content className="warning-content">
            <p>Are you sure you want to delete this item?</p>
            <p>This action cannot be undone.</p>
            <p>
              <small>
                Click outside this modal or press Escape to close it.
              </small>
            </p>
          </ComposableModal.Content>
          <ComposableModal.Actions className="warning-actions">
            <button className="btn btn-secondary" onClick={handleCloseWarning}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleCloseWarning}>
              Delete
            </button>
          </ComposableModal.Actions>
        </ComposableModal>
      </ComposableModal.Backdrop>
    </>
  )
}
