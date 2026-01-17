import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Output Parser Node
 * Parse unstructured text into structured JSON using Regex or Delimiters
 */
export class OutputParserNodeExecutor extends BaseNodeExecutor {
    type = 'output-parser';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const inputString = node.data.input || context.data.content || context.data.output || '';
        const format = node.data.format || 'json'; // json, regex

        this.addLog(context, 'info', `Parsing output as ${format}...`, node.id);

        try {
            if (format === 'json') {
                // Attempt to find JSON block in md ```json ... ``` or raw
                const jsonMatch = inputString.match(/```json\n([\s\S]*?)\n```/) ||
                    inputString.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    const jsonStr = jsonMatch[1] || jsonMatch[0];
                    return JSON.parse(jsonStr);
                }
                // Try raw parse
                return JSON.parse(inputString);

            } else if (format === 'regex') {
                const regexPattern = node.data.regex;
                if (!regexPattern) throw new Error('Regex pattern required');

                const regex = new RegExp(regexPattern, 'g'); // Global for finding all matches if needed? 
                // Or just named groups
                const match = new RegExp(regexPattern).exec(inputString);

                if (match && match.groups) {
                    return match.groups;
                }

                return { matches: inputString.match(regex) };
            }

            return { parsed: inputString };

        } catch (error: any) {
            this.addLog(context, 'error', `Parser Error: ${error.message}`, node.id);
            return { error: error.message, original: inputString };
        }
    }
}
