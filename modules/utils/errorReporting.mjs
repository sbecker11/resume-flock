/**
 * Central error reporting: every error must be reported; if a remedy is applied, report that too.
 * Use in catch blocks: reportError(error, context, remedy); then rethrow or continue as appropriate.
 *
 * @param {Error|unknown} error - The caught error.
 * @param {string} [context] - Where/what failed (e.g. '[ModuleName] operation failed').
 * @param {string} [remedy] - If a remedy was or will be applied, describe it (e.g. 'Reverting to previous value', 'Retrying in 1s').
 */
export function reportError(error, context = '', remedy = '') {
    const prefix = context ? `${context}: ` : '';
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${prefix}${message}`, error instanceof Error ? error : '');

    if (remedy) {
        console.log(`Remedy: ${remedy}`);
    }
}
