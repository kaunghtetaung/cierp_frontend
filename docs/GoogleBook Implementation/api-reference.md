# Google Books API Reference

## API Endpoint

```
GET https://www.googleapis.com/books/v1/volumes?q=isbn:{ISBN}
```

## Request Example

```bash
curl "https://www.googleapis.com/books/v1/volumes?q=isbn:9783319284149"
```

## Response Structure

```json
{
  "kind": "books#volumes",
  "totalItems": 1,
  "items": [
    {
      "kind": "books#volume",
      "id": "VOLUME_ID",
      "etag": "ETAG",
      "selfLink": "https://www.googleapis.com/books/v1/volumes/VOLUME_ID",
      "volumeInfo": {
        "title": "Book Title",
        "subtitle": "Book Subtitle",
        "authors": ["Author 1", "Author 2"],
        "publisher": "Publisher Name",
        "publishedDate": "2016-01-01",
        "description": "Book description...",
        "industryIdentifiers": [
          {
            "type": "ISBN_10",
            "identifier": "3319284142"
          },
          {
            "type": "ISBN_13",
            "identifier": "9783319284149"
          }
        ],
        "pageCount": 320,
        "categories": ["Computers / Programming / General"],
        "imageLinks": {
          "smallThumbnail": "http://books.google.com/...",
          "thumbnail": "http://books.google.com/...",
          "small": "http://books.google.com/...",
          "medium": "http://books.google.com/...",
          "large": "http://books.google.com/...",
          "extraLarge": "http://books.google.com/..."
        },
        "language": "en",
        "previewLink": "http://books.google.com/...",
        "infoLink": "http://books.google.com/..."
      }
    }
  ]
}
```

## Volume Info Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Book title |
| `subtitle` | string | Book subtitle (optional) |
| `authors` | string[] | List of author names |
| `publisher` | string | Publisher name |
| `publishedDate` | string | Publication date (YYYY or YYYY-MM-DD) |
| `description` | string | Book description/synopsis |
| `industryIdentifiers` | array | ISBN identifiers |
| `pageCount` | number | Number of pages |
| `categories` | string[] | Book categories |
| `imageLinks` | object | Cover image URLs at various sizes |
| `language` | string | ISO 639-1 language code |
| `previewLink` | string | Link to Google Books preview |
| `infoLink` | string | Link to Google Books info page |

## Image Links

The `imageLinks` object may contain any combination of these sizes:

| Size | Typical Dimensions | Notes |
|------|-------------------|-------|
| `smallThumbnail` | ~80px wide | Lowest quality |
| `thumbnail` | ~128px wide | Good for lists |
| `small` | ~300px wide | |
| `medium` | ~575px wide | |
| `large` | ~800px wide | |
| `extraLarge` | ~1280px wide | Highest quality |

**Notes:**
- Not all sizes are available for every book
- URLs use HTTP by default; convert to HTTPS for security
- Add `&zoom=2` parameter for higher resolution

## Rate Limits

- No API key required for basic queries
- Default rate limit: ~1000 queries per day per IP
- For higher limits, use Google Books API with API key

## Error Responses

### No Results

```json
{
  "kind": "books#volumes",
  "totalItems": 0
}
```

### Invalid Request

HTTP 400 with error message.

## Implementation Notes

1. **ISBN Cleaning**: Remove hyphens and spaces before querying
2. **HTTPS**: Convert image URLs from HTTP to HTTPS
3. **Caching**: Consider caching responses (1-hour TTL recommended)
4. **Fallback**: Not all books are in Google Books database
5. **Image Quality**: Use `&zoom=2` for better quality thumbnails
