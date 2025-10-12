/**
 * Iteration 1 - 2025-10-12T15:35:53.486Z
 * Agent: test-util
 * Extraction Success: true
 * Execution Success: true
 */

(async () => {
  try {
    // Initialize weave tracing
    await initWeave('test-util');

    /**
     * Formats a date according to the specified format string and options
     * @param date - The date to format (Date object, ISO string, or timestamp)
     * @param format - The format string using tokens (YYYY, MM, DD, HH, mm, ss)
     * @param options - Optional configuration object
     * @param options.locale - Locale for formatting (e.g., 'en-US', 'fr-FR')
     * @param options.timezone - Timezone for formatting (e.g., 'UTC', 'America/New_York')
     * @returns Formatted date string
     */
    const formatDate = createTracedOp('test-util:format_date', 
      (date: Date | string | number, format: string, options?: { locale?: string; timezone?: string }): string => {
        // Parse input date
        const parseInput = createTracedOp('test-util:parse_input', (input: Date | string | number): Date => {
          if (input instanceof Date) {
            if (isNaN(input.getTime())) {
              throw new Error('Invalid Date object');
            }
            return input;
          }
          
          if (typeof input === 'string') {
            const parsed = new Date(input);
            if (isNaN(parsed.getTime())) {
              throw new Error(`Invalid date string: ${input}`);
            }
            return parsed;
          }
          
          if (typeof input === 'number') {
            const parsed = new Date(input);
            if (isNaN(parsed.getTime())) {
              throw new Error(`Invalid timestamp: ${input}`);
            }
            return parsed;
          }
          
          throw new Error(`Unsupported date type: ${typeof input}`);
        });

        // Apply format to date
        const applyFormat = createTracedOp('test-util:apply_format', 
          (d: Date, fmt: string, opts?: { locale?: string; timezone?: string }): string => {
            // Set default options
            const locale = opts?.locale || 'en-US';
            const timeZone = opts?.timezone || 'UTC';
            
            // Configure Intl.DateTimeFormat
            const formatterOptions: Intl.DateTimeFormatOptions = {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
              timeZone
            };
            
            try {
              const formatter = new Intl.DateTimeFormat(locale, formatterOptions);
              const parts = formatter.formatToParts(d);
              const partMap: Record<string, string> = {};
              
              parts.forEach(part => {
                partMap[part.type] = part.value;
              });
              
              // Replace format tokens
              return fmt
                .replace(/YYYY/g, partMap.year || '0000')
                .replace(/MM/g, partMap.month || '00')
                .replace(/DD/g, partMap.day || '00')
                .replace(/HH/g, partMap.hour || '00')
                .replace(/mm/g, partMap.minute || '00')
                .replace(/ss/g, partMap.second || '00');
            } catch (error) {
              if (error instanceof Error) {
                throw new Error(`Timezone error: ${error.message}`);
              }
              throw new Error('Unknown timezone error');
            }
        });

        // Process the date formatting
        const parsedDate = parseInput(date);
        return applyFormat(parsedDate, format, options);
    });

    // Test the function with example usages
    const test1 = formatDate(new Date(), 'YYYY-MM-DD');
    const test2 = formatDate('2023-12-25T15:30:45Z', 'MM/DD/YYYY HH:mm');
    const test3 = formatDate(1703518245000, 'DD-MM-YYYY', { timezone: 'Europe/London' });
    
    console.log(JSON.stringify({
      success: true,
      results: [
        { input: 'new Date()', format: 'YYYY-MM-DD', output: test1 },
        { input: "'2023-12-25T15:30:45Z'", format: 'MM/DD/YYYY HH:mm', output: test2 },
        { input: '1703518245000', format: 'DD-MM-YYYY', options: "{ timezone: 'Europe/London' }", output: test3 }
      ]
    }, null, 2));
    
  } catch (error: unknown) {
    const err = error as Error;
    console.log(JSON.stringify({
      success: false,
      error: err.message,
      stack: err.stack
    }));
  }
})();