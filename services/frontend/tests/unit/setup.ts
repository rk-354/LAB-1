import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Silence process.stderr.write in tests
vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
