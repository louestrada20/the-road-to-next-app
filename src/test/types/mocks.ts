import { Mock } from 'vitest'

export type MockedFunction<T extends (...args: any[]) => any> = Mock<T>

export type MockedAsyncFunction<T extends (...args: any[]) => Promise<any>> = Mock<T>

export type MockedObject<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? MockedFunction<T[K]> : T[K]
}

// Helper function to cast mocked imports with proper types
export function asMock<T extends (...args: any[]) => any>(fn: T): MockedFunction<T> {
  return fn as unknown as MockedFunction<T>
}

export function asMockObject<T>(obj: T): MockedObject<T> {
  return obj as unknown as MockedObject<T>
}
