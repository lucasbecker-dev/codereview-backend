module.exports = {
    // Increase the default timeout for tests to 30 seconds
    testTimeout: 30000,

    // The test environment that will be used for testing
    testEnvironment: 'node',

    // Set NODE_ENV to test
    setupFiles: ['<rootDir>/jest.setup.js'],

    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: false,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // Indicates which provider should be used to instrument code for coverage
    coverageProvider: 'v8',

    // A list of paths to directories that Jest should use to search for files in
    roots: ['<rootDir>/src'],

    // The glob patterns Jest uses to detect test files
    testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: ['/node_modules/'],

    // Indicates whether each individual test should be reported during the run
    verbose: true,
}; 