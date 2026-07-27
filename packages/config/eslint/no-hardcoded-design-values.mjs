const HEX = /#[0-9a-fA-F]{3,8}\b/;
const PX = /\b\d+px\b/;

/** @type {import('eslint').Rule.RuleModule} */
export const noHardcodedDesignValues = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded hex colors and pixel literals in UI components',
    },
    messages: {
      hex: 'Use design tokens (CSS variables) instead of hardcoded hex colors.',
      px: 'Use spacing/type tokens instead of hardcoded pixel values.',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string') {
          return;
        }
        if (HEX.test(node.value)) {
          context.report({ node, messageId: 'hex' });
        }
        if (PX.test(node.value)) {
          context.report({ node, messageId: 'px' });
        }
      },
      TemplateElement(node) {
        const text = node.value.raw;
        if (HEX.test(text)) {
          context.report({ node, messageId: 'hex' });
        }
        if (PX.test(text)) {
          context.report({ node, messageId: 'px' });
        }
      },
    };
  },
};
