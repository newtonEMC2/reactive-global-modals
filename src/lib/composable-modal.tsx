import React, { PropsWithChildren } from 'react'
import { useModalSubscription } from './use-modal-subscription'
import { ModalMediator } from './modal-mediator'
import './composable-modal.module.css'

// CSS class names as constants (CSS modules approach)
const styles = {
  modalTitle: 'modalTitle',
  modalContent: 'modalContent',
  modalActions: 'modalActions',
  modalContainer: 'modalContainer',
  modalBackdrop: 'modalBackdrop',
}

type ModalSubComponentProps = PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement>
>

type ComposableModalProps = PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    id: string
    defaultOpen?: boolean
  }
>

type ModalBackdropProps = PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement>
>

const ModalTitle = React.forwardRef<HTMLDivElement, ModalSubComponentProps>(
  ({ children, className }, ref) => {
    const titleClasses = [styles.modalTitle, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={titleClasses}>
        {children}
      </div>
    )
  }
)

ModalTitle.displayName = 'ComposableModal.Title'

const ModalContent = React.forwardRef<HTMLDivElement, ModalSubComponentProps>(
  ({ children, className }, ref) => {
    const contentClasses = [styles.modalContent, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={contentClasses}>
        {children}
      </div>
    )
  }
)

ModalContent.displayName = 'ComposableModal.Content'

const ModalActions = React.forwardRef<HTMLDivElement, ModalSubComponentProps>(
  ({ children, className }, ref) => {
    const actionsClasses = [styles.modalActions, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={actionsClasses}>
        {children}
      </div>
    )
  }
)

ModalActions.displayName = 'ComposableModal.Actions'

const ModalComponent = React.forwardRef<HTMLDivElement, ComposableModalProps>(
  ({ id, children, defaultOpen, className }, ref) => {
    const { isOpen } = useModalSubscription(id, defaultOpen)

    if (!isOpen) {
      return null
    }

    const containerClasses = [styles.modalContainer, className]
      .filter(Boolean)
      .join(' ')

    const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
      // Prevent click events from bubbling up to backdrop
      event.stopPropagation()
    }

    return (
      <div ref={ref} className={containerClasses} onClick={handleModalClick}>
        {children}
      </div>
    )
  }
)

ModalComponent.displayName = 'ComposableModal'

const ModalBackdrop = React.forwardRef<HTMLDivElement, ModalBackdropProps>(
  ({ children, className, onClick, ...props }, ref) => {
    // Extract modal ID from the first ComposableModal child for closeModal functionality
    const modalChild = React.Children.toArray(children).find(
      child => React.isValidElement(child) && child.type === ModalComponent
    ) as React.ReactElement<ComposableModalProps> | undefined

    const modalId = modalChild?.props.id

    const backdropClasses = [styles.modalBackdrop, className]
      .filter(Boolean)
      .join(' ')

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking directly on the backdrop (not on children)
      if (event.target === event.currentTarget && modalId) {
        // Call custom onClick if provided, otherwise close modal by default
        if (onClick) {
          onClick(event)
        } else {
          ModalMediator.closeModal(modalId)
        }
      }
    }

    // Don't render if no valid modal child is found
    if (!modalChild) {
      return null
    }

    return (
      <div
        ref={ref}
        className={backdropClasses}
        onClick={handleBackdropClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalBackdrop.displayName = 'ComposableModal.Backdrop'

export const ComposableModal = ModalComponent as typeof ModalComponent & {
  Title: typeof ModalTitle
  Content: typeof ModalContent
  Actions: typeof ModalActions
  Backdrop: typeof ModalBackdrop
}

ComposableModal.Title = ModalTitle
ComposableModal.Content = ModalContent
ComposableModal.Actions = ModalActions
ComposableModal.Backdrop = ModalBackdrop
