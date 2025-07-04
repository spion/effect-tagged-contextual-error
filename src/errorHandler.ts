import { TaggedErrorWithContext, isTaggedErrorWithContext } from "./TaggedError.js"

export const formatErrorWithContext = (error: unknown): string => {
  const lines: string[] = []

  const collectContextChain = (err: unknown, depth: number = 0): void => {
    const indent = "  ".repeat(depth)

    if (isTaggedErrorWithContext(err)) {
      lines.push(`${indent}Error [${err._tag}]: ${err.message}`)

      if (err.context && err.context !== err.message) {
        lines.push(`${indent}  Context: ${err.context}`)
      }

      if (err.cause) {
        lines.push(`${indent}  Caused by:`)
        collectContextChain(err.cause, depth + 1)
      }
    } else if (error instanceof Error) {
      lines.push(`${indent}Error: ${error.message}`)
      if (error.stack) {
        lines.push(`${indent}Stack trace:`)
        error.stack
          .split("\n")
          .slice(1)
          .forEach(line => {
            lines.push(`${indent}${line}`)
          })
      }
    } else {
      lines.push(`${indent}Error: ${String(error)}`)
    }
  }

  collectContextChain(error)
  return lines.join("\n")
}

export const printErrorWithContext = (error: unknown): void => {
  console.error(formatErrorWithContext(error))
}

export const getErrorChain = (error: unknown): TaggedErrorWithContext[] => {
  const chain: TaggedErrorWithContext[] = []

  const collect = (err: unknown): void => {
    if (isTaggedErrorWithContext(err)) {
      chain.push(err)
      if (err.cause) {
        collect(err.cause)
      }
    }
  }

  collect(error)
  return chain
}
