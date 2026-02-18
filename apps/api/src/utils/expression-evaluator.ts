import vm from 'node:vm';

/**
 * Safe Expression Evaluator (Backend - Node.js/Bun)
 * Generic VM-sandboxed JavaScript expression evaluator
 * Secure, timeout-protected, and context-aware
 */

export interface ExpressionEvaluatorOptions {
  /**
   * Timeout in milliseconds for expression evaluation
   * @default 100
   */
  timeout?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

export class ExpressionEvaluator {
  private readonly timeout: number;
  private readonly debug: boolean;

  constructor(options: ExpressionEvaluatorOptions = {}) {
    this.timeout = options.timeout ?? 100;
    this.debug = options.debug ?? false;
  }

  /**
   * Evaluate a boolean expression
   * @param expression - Boolean expression to evaluate
   * @param context - Context parameters
   * @returns boolean result
   * @example
   * ```ts
   * evaluator.evaluateBoolean('age > 18 && country === "TR"', { age: 25, country: "TR" })
   * // → true
   * ```
   */
  evaluateBoolean(expression: string, context: Record<string, unknown>): boolean {
    try {
      // Create isolated sandbox with context
      const sandbox = {
        ...context,
        result: false,
        // Add common safe utilities
        Math,
        Date,
        JSON,
        String,
        Number,
        Boolean,
        Array,
        Object,
      };

      // Create isolated VM context
      vm.createContext(sandbox);

      // Build the code to execute
      const code = `result = Boolean(${expression})`;

      if (this.debug) {
        // biome-ignore lint/suspicious/noConsole: Debug logging when explicitly enabled
        console.log('[ExpressionEvaluator] Evaluating:', { expression, context, code });
      }

      // Execute in isolated context with timeout
      vm.runInContext(code, sandbox, {
        timeout: this.timeout,
        displayErrors: false,
      });

      const result = Boolean(sandbox.result);

      if (this.debug) {
        // biome-ignore lint/suspicious/noConsole: Debug logging when explicitly enabled
        console.log('[ExpressionEvaluator] Result:', result);
      }

      return result;
    } catch {
      // Return false for any error (syntax, timeout, access violation, etc.)
      return false;
    }
  }

  /**
   * Evaluate any JavaScript expression and return its value
   * @param expression - Expression to evaluate
   * @param context - Context parameters
   * @returns The evaluated result (any type)
   * @example
   * ```ts
   * evaluator.evaluateExpression('users.filter(u => u.active).length', { users: [...] })
   * // Returns: 5
   *
   * evaluator.evaluateExpression('new Date().getFullYear()', {})
   * // Returns: 2025
   * ```
   */
  evaluateExpression(expression: string, context: Record<string, unknown>): unknown {
    const sandbox = {
      ...context,
      result: undefined as unknown,
      // Add common safe utilities
      Math,
      Date,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object,
    };

    vm.createContext(sandbox);
    const code = `result = (${expression})`;

    vm.runInContext(code, sandbox, {
      timeout: this.timeout,
      displayErrors: false,
    });

    return sandbox.result;
  }

  /**
   * Escape regex special characters (internal helper)
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validate if an expression is syntactically valid
   * @param expression - The expression to validate
   * @param sampleParams - Optional sample parameters to test with
   * @returns true if valid, false otherwise
   */
  isValidExpression(expression: string, sampleParams?: Record<string, unknown>): boolean {
    try {
      // Create sandbox with sample params for validation
      const sandbox = {
        result: false,
        ...(sampleParams || {}),
        // Add common safe utilities
        Math,
        Date,
        JSON,
        String,
        Number,
        Boolean,
        Array,
        Object,
      };
      vm.createContext(sandbox);
      const code = `result = Boolean(${expression})`;
      vm.runInContext(code, sandbox, { timeout: 10 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Evaluate template string with ${{expressions}} and replace them with results
   * Perfect for long text content with embedded dynamic values
   * @param template - Template string with ${{expressions}}
   * @param context - Context parameters
   * @returns Processed template string
   * @example
   * ```ts
   * const template = "Hello ${{user.name}}, you have ${{messages.length}} messages.";
   * evaluator.evaluateTemplate(template, { user: { name: "John" }, messages: [1, 2, 3] });
   * // Returns: "Hello John, you have 3 messages."
   * ```
   */
  evaluateTemplate(template: string, context: Record<string, unknown>): string {
    try {
      let result = template;

      // Simple parser: find ${{ and matching }}
      // Handle string literals to avoid false matches inside strings
      const matches: Array<{ fullMatch: string; expression: string }> = [];
      let pos = 0;

      while (pos < result.length) {
        // Find next ${{
        const startPos = result.indexOf('${{', pos);
        if (startPos === -1) break;

        // Now find the matching }}
        // We need to track string literals and nested braces
        let i = startPos + 3; // Start after ${{
        let braceDepth = 0;
        let inString = false;
        let stringDelimiter = '';
        let foundEnd = false;

        while (i < result.length - 1) {
          const char = result[i];
          const nextChar = result[i + 1];

          // Check for escape sequences
          if (char === '\\' && inString) {
            i += 2; // Skip escaped character
            continue;
          }

          // Track string state
          if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringDelimiter = char;
            i++;
            continue;
          }

          if (inString && char === stringDelimiter) {
            inString = false;
            stringDelimiter = '';
            i++;
            continue;
          }

          // Only count braces outside strings
          if (!inString) {
            if (char === '{') {
              braceDepth++;
              i++;
              continue;
            }

            if (char === '}') {
              if (braceDepth > 0) {
                braceDepth--;
                i++;
                continue;
              }

              // We're at depth 0 and found a }
              // Check if next char is also } (closing }})
              if (nextChar === '}') {
                // Found the closing }}
                const fullMatch = result.substring(startPos, i + 2);
                const expression = result.substring(startPos + 3, i).trim();
                matches.push({ fullMatch, expression });
                pos = i + 2;
                foundEnd = true;
                break;
              }
            }
          }

          i++;
        }

        // If we didn't find a matching }}, skip this ${{ and continue
        if (!foundEnd) {
          pos = startPos + 3;
        }
      }

      // Process all matches
      const replacements: Array<{ pattern: string; value: string }> = [];

      for (const { fullMatch, expression } of matches) {
        if (!expression) continue;

        // Create sandbox with full context for JS expression evaluation
        const sandbox = {
          ...context,
          result: undefined as unknown,
          // Add common safe utilities
          Math,
          Date,
          JSON,
          String,
          Number,
          Boolean,
          Array,
          Object,
        };

        try {
          // Create isolated VM context
          vm.createContext(sandbox);

          // Execute the expression directly in the sandbox
          const code = `result = (${expression})`;

          if (this.debug) {
            // biome-ignore lint/suspicious/noConsole: Debug logging when explicitly enabled
            console.log('[ExpressionEvaluator] Evaluating template expression:', {
              expression,
              context: Object.keys(context),
            });
          }

          vm.runInContext(code, sandbox, {
            timeout: this.timeout,
            displayErrors: false,
          });

          // Convert result to string
          const evalResult = sandbox.result;
          const stringValue = String(evalResult ?? '');

          if (this.debug) {
            // biome-ignore lint/suspicious/noConsole: Debug logging when explicitly enabled
            console.log('[ExpressionEvaluator] Expression result:', {
              expression,
              result: evalResult,
              stringValue,
            });
          }

          replacements.push({
            pattern: fullMatch, // Full match including ${{}}
            value: stringValue,
          });
        } catch (error) {
          if (this.debug) {
            console.warn('[ExpressionEvaluator] Expression evaluation failed:', {
              expression,
              error: error instanceof Error ? error.message : String(error),
            });
          }

          // If VM execution fails, replace with empty string
          replacements.push({
            pattern: fullMatch,
            value: '',
          });
        }
      }

      // Apply all replacements
      for (const { pattern, value } of replacements) {
        result = result.replace(new RegExp(this.escapeRegex(pattern), 'g'), value);
      }

      if (this.debug) {
        // biome-ignore lint/suspicious/noConsole: Debug logging when explicitly enabled
        console.log('[ExpressionEvaluator] Template evaluation complete:', {
          original: template,
          result,
        });
      }

      return result;
    } catch (error) {
      if (this.debug) {
        console.error('[ExpressionEvaluator] Template evaluation error:', error);
      }
      return template; // Return original template on error
    }
  }
}

// ============================================================================
// Convenience API
// ============================================================================

/**
 * Default singleton instance
 */
export const expressionEvaluator = new ExpressionEvaluator();

/**
 * Evaluate any JavaScript expression and return its value
 * @example
 * ```ts
 * evaluateExpression('users.length', { users: [1,2,3] }) // → 3
 * evaluateExpression('Math.max(...scores)', { scores: [85, 90, 78] }) // → 90
 * ```
 */
export function evaluateExpression<T = unknown>(
  expression: string,
  context: Record<string, unknown>,
  options?: ExpressionEvaluatorOptions,
): T {
  const evaluator = options ? new ExpressionEvaluator(options) : expressionEvaluator;
  return evaluator.evaluateExpression(expression, context) as T;
}

/**
 * Evaluate a boolean expression
 * @example
 * ```ts
 * evaluateBoolean('age > 18', { age: 25 }) // → true
 * ```
 */
export function evaluateBoolean(
  expression: string,
  context: Record<string, unknown>,
  options?: ExpressionEvaluatorOptions,
): boolean {
  const evaluator = options ? new ExpressionEvaluator(options) : expressionEvaluator;
  return evaluator.evaluateBoolean(expression, context);
}

/**
 * Evaluate template string with ${{expressions}}
 * @example
 * ```ts
 * const template = "Hello ${{user.name}}, you have ${{messages.length}} messages.";
 * evaluateTemplate(template, { user: { name: "John" }, messages: [1, 2, 3] });
 * // → "Hello John, you have 3 messages."
 * ```
 */
export function evaluateTemplate(
  template: string,
  context: Record<string, unknown>,
  options?: ExpressionEvaluatorOptions,
): string {
  const evaluator = options ? new ExpressionEvaluator(options) : expressionEvaluator;
  return evaluator.evaluateTemplate(template, context);
}
