import { Effect, pipe } from "effect"
import { TaggedError, withTaggedContext, printErrorWithContext } from "./index.js"

class APIError extends TaggedError("APIError") {}
class ImageProcessingError extends TaggedError("ImageProcessingError") {}
class ContentError extends TaggedError("ContentError") {}
class CrawlError extends TaggedError("CrawlError") {}

const callImageAPI = (imageUrl: string) =>
  Effect.fail(
    new APIError({
      message: "Unsupported image format: WEBP",
    })
  )

const generateImageAltText = (imageUrl: string) =>
  pipe(
    callImageAPI(imageUrl),
    withTaggedContext(ImageProcessingError, () => `Failed to generate accessibility text for image: ${imageUrl}`)
  )

const processPageContent = (url: string) =>
  pipe(
    generateImageAltText("https://example.com/images/diagram.webp"),
    withTaggedContext(ContentError, () => `Error processing content for URL: ${url}`)
  )

const crawlAndGenerateToc = (urls: string[]) =>
  pipe(
    processPageContent(urls[0]),
    withTaggedContext(CrawlError, () => `Failed to complete web crawl for ${urls.length} URLs`)
  )

const program = pipe(
  crawlAndGenerateToc([
    "https://example.com/guide/introduction",
    "https://example.com/guide/getting-started",
    "https://example.com/guide/advanced"
  ]),
  Effect.catchAll(error => {
    printErrorWithContext(error)
    return Effect.succeed("Crawl failed")
  })
)

Effect.runPromise(program).then(console.log)
