import zwitch from 'zwitch'
import configure from 'mdast-util-to-markdown/lib/configure'
import defaultHandlers from 'mdast-util-to-markdown/lib/handle'
import defaultJoin from 'mdast-util-to-markdown/lib/join'
import defaultUnsafe from 'mdast-util-to-markdown/lib/unsafe'
import listItem from './handle/list-item'
import list from './handle/list'
import link from './handle/link'
import root from './handle/root'
import element from './handle/element'
import code from './handle/code'
import proseTable from './handle/prose-table'
import proseTr from './handle/prose-tr'
import proseTh from './handle/prose-th'
import proseTd from './handle/prose-td'
import proseThead from './handle/prose-thead'
import proseTbody from './handle/prose-tbody'

export function toMarkdown(tree, options = {}) {
  const settings = options || {}
  const context = {
    enter,
    stack: [],
    unsafe: [],
    join: [],
    handlers: {},
    options: {} as any,
    handle: undefined as any
  }

  configure(context, {
    unsafe: defaultUnsafe,
    join: defaultJoin,
    handlers: {
      ...defaultHandlers,
      listItem,
      list,
      link,
      root,
      element,
      proseTable,
      proseTr,
      proseTd,
      proseTh,
      proseTbody,
      proseThead,
      code
    }
  })
  configure(context, settings)

  if (context.options.tightDefinitions) {
    context.join = [joinDefinition].concat(context.join)
  }

  context.handle = zwitch('type', {
    invalid,
    unknown,
    handlers: context.handlers
  })

  const result = context.handle(tree, null, context)

  // if (result && result.charCodeAt(result.length - 1) !== 10 && result.charCodeAt(result.length - 1) !== 13) {
  //   result += '\n'
  // }

  return result

  function enter(name) {
    context.stack.push(name)
    return exit

    function exit() {
      context.stack.pop()
    }
  }
}

function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

function unknown(node) {
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}

function joinDefinition(left, right) {
  // No blank line between adjacent definitions.
  if (left.type === 'definition' && left.type === right.type) {
    return 0
  }
}
