import { Data } from "effect"

export interface TaggedErrorWithContext<Tag extends string = string> {
  readonly _tag: Tag
  readonly message: string
  readonly context?: string
  readonly cause?: TaggedErrorWithContext<string>
}

export const TaggedError = <Tag extends string>(tag: Tag) => {
  return Data.TaggedError(tag)<{
    readonly message: string
    readonly cause?: TaggedErrorWithContext<string>
  }>
}

export const isTaggedErrorWithContext = (u: unknown): u is TaggedErrorWithContext => {
  return (
    typeof u === "object" &&
    u !== null &&
    "_tag" in u &&
    "message" in u &&
    typeof (u as any)._tag === "string" &&
    typeof (u as any).message === "string"
  )
}
