/** @type {import('eslint').Rule.RuleModule} */
export const noServerEnvInClient = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-NEXT_PUBLIC process.env access in client components (secrets must not ship in bundles)',
    },
    messages: {
      serverEnvInClient:
        'Client components may only read process.env.NEXT_PUBLIC_* variables. Use "{{name}}" on the server or expose via NEXT_PUBLIC_ if safe.',
      serverEnvImport:
        'Do not import server environment loaders in client components. Use NEXT_PUBLIC_* values only.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const program = sourceCode.ast;

    function hasUseClientDirective() {
      for (const node of program.body) {
        if (node.type === 'ExpressionStatement' && node.directive === 'use client') {
          return true;
        }
      }
      return false;
    }

    if (!hasUseClientDirective()) {
      return {};
    }

    const bannedServerEnvImports = new Set([
      '@food-marketplace/config/env',
      '@food-marketplace/config/env.js',
    ]);

    function isProcessEnv(node) {
      return (
        node.type === 'MemberExpression' &&
        !node.computed &&
        node.object.type === 'Identifier' &&
        node.object.name === 'process' &&
        node.property.type === 'Identifier' &&
        node.property.name === 'env'
      );
    }

    function envVarName(property) {
      if (property.type === 'Identifier') {
        return property.name;
      }
      if (property.type === 'Literal' && typeof property.value === 'string') {
        return property.value;
      }
      return null;
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source === 'string' && bannedServerEnvImports.has(source)) {
          context.report({ node, messageId: 'serverEnvImport' });
        }
      },
      MemberExpression(node) {
        if (!isProcessEnv(node.object)) {
          return;
        }
        const name = envVarName(node.property);
        if (name && !name.startsWith('NEXT_PUBLIC_')) {
          context.report({ node, messageId: 'serverEnvInClient', data: { name } });
        }
      },
    };
  },
};
