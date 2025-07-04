import { describe, it, expect, vi } from "vitest"
import { TaggedError } from "../TaggedError.js"
import { formatErrorWithContext, printErrorWithContext, getErrorChain } from "../errorHandler.js"

class NetworkError extends TaggedError("NetworkError") {}
class DatabaseError extends TaggedError("DatabaseError") {}
class ServiceError extends TaggedError("ServiceError") {}

describe("Error Handler", () => {
  describe("formatErrorWithContext", () => {
    it("should format a single error", () => {
      const error = new NetworkError({ message: "Connection timeout" })
      const formatted = formatErrorWithContext(error)

      expect(formatted).toBe("Error [NetworkError]: Connection timeout")
    })

    it("should format an error chain with proper indentation", () => {
      const error = new ServiceError({
        message: "Service unavailable",
        cause: new DatabaseError({
          message: "Database connection failed",
          cause: new NetworkError({
            message: "Connection timeout",
          }),
        }),
      })

      const formatted = formatErrorWithContext(error)
      const lines = formatted.split("\n")

      expect(lines[0]).toBe("Error [ServiceError]: Service unavailable")
      expect(lines[1]).toBe("  Caused by:")
      expect(lines[2]).toBe("  Error [DatabaseError]: Database connection failed")
      expect(lines[3]).toBe("    Caused by:")
      expect(lines[4]).toBe("    Error [NetworkError]: Connection timeout")
    })

    it("should handle regular Error objects", () => {
      const error = new Error("Regular error message")
      const formatted = formatErrorWithContext(error)

      expect(formatted).toContain("Error: Regular error message")
    })

    it("should handle non-Error objects", () => {
      const error = "String error"
      const formatted = formatErrorWithContext(error)

      expect(formatted).toBe("Error: String error")
    })

    it("should handle null and undefined", () => {
      expect(formatErrorWithContext(null)).toBe("Error: null")
      expect(formatErrorWithContext(undefined)).toBe("Error: undefined")
    })
  })

  describe("printErrorWithContext", () => {
    it("should print error to console.error", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const error = new NetworkError({ message: "Test error" })

      printErrorWithContext(error)

      expect(consoleSpy).toHaveBeenCalledWith("Error [NetworkError]: Test error")
      consoleSpy.mockRestore()
    })
  })

  describe("getErrorChain", () => {
    it("should return empty array for non-tagged errors", () => {
      const chain = getErrorChain(new Error("Regular error"))
      expect(chain).toEqual([])
    })

    it("should return single error for error without cause", () => {
      const error = new NetworkError({ message: "Test error" })
      const chain = getErrorChain(error)

      expect(chain).toHaveLength(1)
      expect(chain[0]).toBe(error)
    })

    it("should return full error chain", () => {
      const networkError = new NetworkError({ message: "Network error" })
      const dbError = new DatabaseError({
        message: "DB error",
        cause: networkError,
      })
      const serviceError = new ServiceError({
        message: "Service error",
        cause: dbError,
      })

      const chain = getErrorChain(serviceError)

      expect(chain).toHaveLength(3)
      expect(chain[0]).toBe(serviceError)
      expect(chain[1]).toBe(dbError)
      expect(chain[2]).toBe(networkError)
      expect(chain[0]._tag).toBe("ServiceError")
      expect(chain[1]._tag).toBe("DatabaseError")
      expect(chain[2]._tag).toBe("NetworkError")
    })

    it("should handle mixed error types in chain", () => {
      const serviceError = new ServiceError({
        message: "Service error",
        cause: {
          _tag: "UnknownError",
          message: "Unknown error occurred",
        },
      })

      const chain = getErrorChain(serviceError)

      expect(chain).toHaveLength(2)
      expect(chain[0]._tag).toBe("ServiceError")
      expect(chain[1]._tag).toBe("UnknownError")
    })
  })
})
