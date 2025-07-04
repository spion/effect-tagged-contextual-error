# Effect Tagged Contextual Error

A tagged error system with context for Effect TS, inspired by Rust's anyhow crate. This library allows you to create typed errors with contextual information that forms a chain, making error debugging much easier.

## Features

- Tagged errors with discriminated unions
- Context chain similar to anyhow's `context()` method
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
import { TaggedError, withTaggedContext, printErrorWithContext } from "effect-tagged-anyhow"

// Define your error types
class APIError extends TaggedError("APIError") {}
class ImageProcessingError extends TaggedError("ImageProcessingError") {}
class ContentError extends TaggedError("ContentError") {}
class CrawlError extends TaggedError("CrawlError") {}

// Low-level API call that might fail
const callImageAPI = (imageUrl: string) =>
  Effect.fail(
    new APIError({
      message: "Unsupported image format: WEBP",
    })
  )

// Generate accessibility text for an image
const generateImageAltText = (imageUrl: string) =>
  pipe(
    callImageAPI(imageUrl),
    withTaggedContext(
      ImageProcessingError,
      () => `Failed to generate accessibility text for image: ${imageUrl}`
    )
  )

// Process a single page's content
const processPageContent = (url: string) =>
  pipe(
    // Simulate finding an image that needs alt text
    generateImageAltText("https://example.com/images/diagram.webp"),
    withTaggedContext(ContentError, () => `Error processing content for URL: ${url}`)
  )

// Crawl multiple URLs and generate a table of contents
const crawlAndGenerateToc = (urls: string[]) =>
  pipe(
    // Process the first URL (in real code, you'd process all)
    processPageContent(urls[0]),
    withTaggedContext(CrawlError, () => `Failed to complete web crawl for ${urls.length} URLs`)
  )

// Run the crawler
Effect.runPromise(
  pipe(
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
)
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

The context chain tells the complete story of the failure, making it easy to debug and potentially skip unsupported images or implement format conversion.

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
