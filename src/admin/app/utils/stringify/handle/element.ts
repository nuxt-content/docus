import repeat from 'repeat-string'
import indentLines from 'mdast-util-to-markdown/lib/util/indent-lines'
import flow from '../util/container-flow'

export default function element(node, parent, context) {
  const props = node.attrs || node.props || {}
  const tagName = props._tag || ''

  // remove tag props
  delete props._tag

  const exit = context.enter('element')

  const attrs = Object.keys(props)
    .sort()
    .map(key => {
      if (props[key] === null || typeof props[key] === 'undefined') {
        return ''
      }
      if (props[key] === '') {
        return key
      }
      return `${key}="${props[key]}"`
    })
    .filter(Boolean)
    .join(' ')

  let children = flow(node, context, '\n\n')
  const level = node.element_level || 3
  const sep = repeat(':', level)

  children = indentLines(children, map)
  const value = `${sep}${tagName}{${attrs}}\n${children}\n${sep}`

  parent.element_level = level + 1
  exit()
  return value

  function map(line, index, blank) {
    if (index) {
      return (blank ? '' : repeat(' ', level - 3)) + line
    }

    return repeat(' ', level - 3) + line
  }
}
