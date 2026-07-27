const JUSTIFICATION = /client-justification:|requires client because|use-client:/i;

/** @type {import('eslint').Rule.RuleModule} */
export const requireUseClientJustification = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require a justification comment when using "use client"',
    },
    schema: [],
    messages: {
      missing:
        'Files with "use client" must include a client-justification comment on line 2 (e.g. // client-justification: ...).',
    },
  },
  create(context) {
    const source = context.sourceCode;
    return {
      Program(node) {
        const text = source.getText(node);
        if (!text.includes("'use client'") && !text.includes('"use client"')) {
          return;
        }
        const firstLines = text.split('\n').slice(0, 4).join('\n');
        if (!JUSTIFICATION.test(firstLines)) {
          context.report({ node, messageId: 'missing' });
        }
      },
    };
  },
};
