import { ActionState, EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state'

export const createSuccessActionState = (
  message: string = 'Success',
  data?: any
): ActionState => ({
  status: 'SUCCESS',
  message,
  fieldErrors: {},
  timestamp: Date.now(),
  data,
})

export const createErrorActionState = (
  message: string = 'Error',
  fieldErrors: Record<string, string[]> = {}
): ActionState => ({
  status: 'ERROR',
  message,
  fieldErrors,
  timestamp: Date.now(),
})

export const createFieldErrorActionState = (
  fieldErrors: Record<string, string[]>
): ActionState => ({
  status: 'ERROR',
  message: '',
  fieldErrors,
  timestamp: Date.now(),
})

export const createEmptyActionState = (): ActionState => ({
  ...EMPTY_ACTION_STATE,
  timestamp: Date.now(),
})
