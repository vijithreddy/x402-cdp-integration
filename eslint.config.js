import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,
  
  // TypeScript files configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.json'],
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        global: 'readonly',
        // Browser globals (for compatibility)
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript recommended rules (more lenient)
      ...typescript.configs.recommended.rules,
      
      // TypeScript-specific rules (relaxed)
      '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for CLI
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'ignoreRestSiblings': true 
      }],
      
      // General code quality
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Allowed for CLI applications
      'no-undef': 'off', // TypeScript handles this better
    },

  },
  
  // Relaxed rules for utility files
  {
    files: ['src/shared/utils/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Utils often need any
    }
  },
  
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'docs/**',
      '*.js',
      'eslint.config.js' // Ignore the config file itself
    ]
  }
]; 