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
