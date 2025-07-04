import { describe, it, expect } from "vitest"
import { Effect, pipe, Cause } from "effect"
import { TaggedError, withTaggedContext, formatErrorWithContext, getErrorChain } from "../index.js"

class FileError extends TaggedError("FileError") {}
class ParseError extends TaggedError("ParseError") {}
class ValidationError extends TaggedError("ValidationError") {}

describe("TaggedError with Context", () => {
  it("should create a tagged error with context", () => {
    const error = new FileError({
      message: "File config.json not found",
    })

    expect(error._tag).toBe("FileError")
    expect(error.message).toBe("File config.json not found")
  })

  it("should chain errors with context", async () => {
    const program = pipe(
      Effect.fail(new FileError({ message: "File config.json not found" })),
      withTaggedContext(ParseError, () => "Failed to parse configuration"),
      withTaggedContext(ValidationError, () => "Invalid application settings")
    )

    const result = await Effect.runPromiseExit(program)

    expect(result._tag).toBe("Failure")
    if (result._tag === "Failure") {
      const error = Cause.squash(result.cause) as any
      expect(error._tag).toBe("ValidationError")
      expect(error.cause?._tag).toBe("ParseError")
      expect(error.cause?.cause?._tag).toBe("FileError")
    }
  })

  it("should format error with context chain", async () => {
    const program = pipe(
      Effect.fail(new FileError({ message: "config.json not found" })),
      withTaggedContext(ParseError, () => "Unable to load configuration file"),
      withTaggedContext(ValidationError, () => "Application startup failed")
    )

    const result = await Effect.runPromiseExit(program)

    if (result._tag === "Failure") {
      const error = Cause.squash(result.cause) as any
      const formatted = formatErrorWithContext(error)

      expect(formatted).toContain("ValidationError")
      expect(formatted).toContain("Application startup failed")
      expect(formatted).toContain("ParseError")
      expect(formatted).toContain("Unable to load configuration file")
      expect(formatted).toContain("FileError")
      expect(formatted).toContain("config.json not found")
    }
  })

  it("should get error chain", async () => {
    const program = pipe(
      Effect.fail(new FileError({ message: "File error" })),
      withTaggedContext(ParseError, () => "Parse error context"),
      withTaggedContext(ValidationError, () => "Validation error context")
    )

    const result = await Effect.runPromiseExit(program)

    if (result._tag === "Failure") {
      const error = Cause.squash(result.cause) as any
      const chain = getErrorChain(error)

      expect(chain).toHaveLength(3)
      expect(chain[0]._tag).toBe("ValidationError")
      expect(chain[1]._tag).toBe("ParseError")
      expect(chain[2]._tag).toBe("FileError")
    }
  })
})
