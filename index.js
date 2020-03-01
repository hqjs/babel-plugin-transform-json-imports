const path = require('path');

const RELATIVE_PATTERN = /\s*(\.{1,2})\/([^'"]*)/g;

const notJsonImport = modName => !modName.endsWith('.json');

const replace = (baseURI, dirname) =>
  (match, dots, rest) => `${baseURI}${path.join(dirname, dots, rest)}`;

const notRequire = (t, nodePath) => {
  const [requireArg, ...rest] = nodePath.node.arguments;
  return nodePath.node.callee.name !== 'require' ||
    rest.length !== 0 ||
    !t.isStringLiteral(requireArg) ||
    nodePath.scope.hasBinding('require');
};

module.exports = function ({ types: t }) {
  return {
    visitor: {
      CallExpression(nodePath, stats) {
        const { dirname, fs = require('fs') } = stats.opts;
        if (notRequire(t, nodePath)) return;
        const { node, parent } = nodePath;
        const [requireArg] = node.arguments;
        const { value: modName } = requireArg;
        if (notJsonImport(modName)) return;

        const filepath = modName.replace(RELATIVE_PATTERN, replace('', dirname));
        const json = JSON.parse(fs.readFileSync(filepath, { encoding: 'utf8' }));

        nodePath.replaceWith(t.valueToNode(cleanRequiredJSON(t, parent, json)));
      },
      ImportDeclaration(nodePath, stats) {
        const { dirname, fs = require('fs') } = stats.opts;
        const { node } = nodePath;
        const { value: modName } = nodePath.node.source;

        if (notJsonImport(modName)) return;

        const leftExpression = determineLeftExpression(t, node);
        const filepath = modName.replace(RELATIVE_PATTERN, replace('', dirname));
        const json = JSON.parse(fs.readFileSync(filepath, { encoding: 'utf8' }));

        nodePath.replaceWith(t.variableDeclaration('const', [
          t.variableDeclarator(
            leftExpression,
            t.valueToNode(cleanJSON(t, node, json)),
          ),
        ]));
      },
    },
  };
};

function determineLeftExpression(t, node) {
  if (isDestructuredImportExpression(t, node)) {
    return buildObjectPatternFromDestructuredImport(t, node);
  }

  const [specifier] = node.specifiers;

  return t.identifier(specifier.local.name);
}

function isDestructuredImportExpression(t, node) {
  return node.specifiers.length !== 0 && node.specifiers.some(specifier => !t.isImportDefaultSpecifier(specifier));
}

function buildObjectPatternFromDestructuredImport(t, node) {
  const properties = node.specifiers.map(specifier => t.objectProperty(
    t.identifier(specifier.imported.name),
    t.identifier(specifier.local.name)
  ));

  return t.objectPattern(properties);
}

function cleanJSON(t, node, json) {
  if (isDestructuredImportExpression(t, node)) {
    const res = {};
    for (const specifier of node.specifiers) {
      const { name } = specifier.imported;
      if (name in json) res[name] = json[name];
    }
    return res;
  }

  return json;
}

function cleanRequiredJSON(t, node, json) {
  if (t.isObjectPattern(node.id)) {
    const res = {};
    for (const property of node.id.properties) {
      const { name } = property.key;
      if (name in json) res[name] = json[name];
    }
    return res;
  }

  return json;
}
