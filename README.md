# Effect Tagged Contextual Error

A tagged error system with context for Effect TS, inspired by Rust's anyhow crate. This library allows you to create typed errors with contextual information that forms a chain, making error debugging much easier.

## Features

- Tagged errors with discriminated unions
- Context chain similar to anyhow's `with_context()` method
- Pretty printing of error chains
- Full TypeScript type safety
- Integration with Effect's error handling

## Installation

```bash
npm install effect-tagged-anyhow
```

## Usage

### Basic Example

Imagine you're building a web crawler that processes multiple URLs to create accessible documentation. When something fails deep in the process, you need to know exactly where and why:

```typescript
import { Effect, pipe } from "effect"
import { TaggedError, withTaggedContext, printErrorWithContext } from "./index.js"

class APIError extends TaggedError("APIError") {}
class ImageProcessingError extends TaggedError("ImageProcessingError") {}
class ContentError extends TaggedError("ContentError") {}
class CrawlError extends TaggedError("CrawlError") {}

const callImageAPI = Effect.fn("callImageAPI")(function* (imageUrl: string) {
  if (imageUrl.endsWith(".webp")) {
    return yield* Effect.fail(
      new APIError({
        message: "Unsupported image format: WEBP",
      })
    )
  } else {
    // Simulate a successful API call for other formats
    return `Generated alt text for ${imageUrl}`
  }
})

const generateImageAltTextSuggestion = Effect.fn("generateImageAltTextSuggestion")(function* (
  imageUrl: string
) {
  return yield* callImageAPI(imageUrl).pipe(
    withTaggedContext(
      ImageProcessingError,
      () => `Failed to generate accessibility text for image: ${imageUrl}`
    )
  )
})

const processPageContent = Effect.fn("processPageContent")(function* (url: string) {
  return yield* generateImageAltTextSuggestion("https://example.com/images/diagram.webp").pipe(
    withTaggedContext(ContentError, () => `Error processing content for URL: ${url}`)
  )
})

const crawlAndGenerateToc = Effect.fn("crawlAndGenerateToc")(function* (urls: string[]) {
  let results = []
  for (const url of urls) {
    let resultForUrl = yield* processPageContent(url).pipe(
      withTaggedContext(CrawlError, () => `Error processing URL: ${url}`)
    )
    results.push(resultForUrl)
  }
  return results
})

const program = pipe(
  crawlAndGenerateToc([
    "https://example.com/guide/introduction",
    "https://example.com/guide/getting-started",
    "https://example.com/guide/advanced",
  ]),
  Effect.catchAll(error => {
    printErrorWithContext(error)
    return Effect.succeed("Crawl failed")
  })
)

Effect.runPromise(program).then(console.log)
```

Output:

```
Error [CrawlError]: Failed to complete web crawl for 3 URLs
  Caused by:
  Error [ContentError]: Error processing content for URL: https://example.com/guide/introduction
    Caused by:
    Error [ImageProcessingError]: Failed to generate accessibility text for image: https://example.com/images/diagram.webp
      Caused by:
      Error [APIError]: Unsupported image format: WEBP
```

Without context, you'd just see "Unsupported image format: WEBP" and have no idea:

- Which crawl job failed
- Which specific URL was being processed
- Which image caused the problem
- What operation was being attempted on the image
- How many URLs were in the batch

The context chain tells the complete story of the failure, making it easy to debug.

### API

#### `TaggedError(tag: string)`

Creates a tagged error class with the specified tag.

#### `withTaggedContext(ErrorClass, contextFn)`

Wraps an Effect's error with a new tagged error and context message.

#### `printErrorWithContext(error)`

Pretty prints an error with its full context chain.

#### `formatErrorWithContext(error)`

Returns a formatted string of the error chain.

#### `getErrorChain(error)`

Returns an array of all errors in the chain.

## License

ISC
