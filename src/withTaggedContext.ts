import { Effect, pipe } from "effect"
import { TaggedError, TaggedErrorWithContext, isTaggedErrorWithContext } from "./TaggedError.js"

export const withTaggedContext =
  <R, A, E, Tag extends string>(
    ErrorClass: ReturnType<typeof TaggedError<Tag>>,
    context: () => string
  ) =>
  (
    self: Effect.Effect<A, E, R>
  ): Effect.Effect<A, InstanceType<ReturnType<typeof TaggedError<Tag>>>, R> => {
    return pipe(
      self,
      Effect.mapError(error => {
        const contextStr = context()

        if (isTaggedErrorWithContext(error)) {
          return new ErrorClass({
            message: contextStr,
            cause: error,
          })
        } else if (error instanceof Error) {
          return new ErrorClass({
            message: error.message,
            cause: {
              _tag: "UnknownError",
              message: error.message,
            } as TaggedErrorWithContext<"UnknownError">,
          })
        } else {
          return new ErrorClass({
            message: String(error),
            cause: {
              _tag: "UnknownError",
              message: String(error),
            } as TaggedErrorWithContext<"UnknownError">,
          })
        }
      })
    )
  }
