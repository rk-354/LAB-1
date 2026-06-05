import '@testing-library/jest-dom'

// Silence process.stderr.write in tests
vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
