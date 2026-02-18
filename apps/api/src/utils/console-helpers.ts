/**
 * Console error wrapper that filters specific error messages
 */
export function createConsoleErrorFilter(suppressPatterns: {
  messagePattern?: string;
  errorMessages?: string[];
}) {
  const originalError = console.error;

  // Create wrapped console.error
  // biome-ignore lint/suspicious/noExplicitAny: Console.error accepts any arguments
  const wrappedError = (...args: any[]) => {
    // Early return if no suppress patterns defined
    if (!suppressPatterns.errorMessages?.length && !suppressPatterns.messagePattern) {
      originalError(...args);
      return;
    }

    // Convert all arguments to searchable strings
    const argsAsStrings = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      if (arg?.error instanceof Error) return arg.error.message;
      if (typeof arg?.error === 'string') return arg.error;
      return JSON.stringify(arg);
    });

    // Check if any argument contains any of our suppress messages
    const shouldSuppress = suppressPatterns.errorMessages?.some((suppressMsg) =>
      argsAsStrings.some((argStr) => argStr.includes(suppressMsg)),
    );

    if (shouldSuppress) {
      return; // Suppress this error
    }

    // Check pattern matching if defined
    if (suppressPatterns.messagePattern) {
      const hasPattern = argsAsStrings.some((argStr) =>
        argStr.includes(suppressPatterns.messagePattern!),
      );

      if (hasPattern && shouldSuppress) {
        return; // Suppress this error
      }
    }

    // Pass through all other errors
    originalError(...args);
  };

  return {
    /** Apply the console.error filter */
    apply: () => {
      console.error = wrappedError;
    },
    /** Restore original console.error */
    restore: () => {
      console.error = originalError;
    },
  };
}

/**
 * Executes a function with console.error filtering active
 * Automatically restores console.error after execution
 *
 * @example
 * ```ts
 * await withConsoleErrorFilter(
 *   { messagePattern: "Error in", errorMessages: ["abort"] },
 *   async () => {
 *     // Your code here
 *   }
 * );
 * ```
 */
export async function withConsoleErrorFilter<T>(
  suppressPatterns: {
    messagePattern?: string;
    errorMessages?: string[];
  },
  fn: () => Promise<T>,
): Promise<T> {
  const filter = createConsoleErrorFilter(suppressPatterns);
  filter.apply();

  try {
    return await fn();
  } finally {
    filter.restore();
  }
}
