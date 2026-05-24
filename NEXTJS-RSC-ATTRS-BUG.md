# Next.js Server Action RSC encoder strips `attrs` property value

**Next.js version**: 15.4.8 / 15.4.10
**React version**: 19.1.0
**OS**: Linux (Docker)
**Bundler**: webpack (default Next.js dev)

## Summary

When a Server Action is invoked from the client with an object that contains a property literally named `attrs`, the property survives the browser → server boundary as a key BUT its value is reset to `undefined`. Nested attrs values (e.g. Tiptap / ProseMirror image node attrs like `src`, `alt`, `width`, `height`) are silently lost.

Reproduction is 100% repeatable with plain JSON objects — no class instances, no React elements, no Date / Map / Set / Buffer involved.

## Reproduction

```ts
// app/actions.ts
'use server';

export async function probe(data: any) {
  const img = data?.body?.en?.content?.find((n: any) => n.type === 'image');
  // Logs on the SERVER (post-decode):
  //   img.attrs is enumerable own-property: YES
  //   img.attrs value: undefined
  //   JSON.stringify(img): {"type":"image"}
  console.log({
    ownKeys: Object.getOwnPropertyNames(img),
    descriptor: Object.getOwnPropertyDescriptor(img, 'attrs'),
    value: img.attrs,
    stringified: JSON.stringify(img),
  });
  return null;
}
```

```tsx
// app/page.tsx (client component)
'use client';
import { probe } from './actions';

export default function Page() {
  return (
    <button
      onClick={() => {
        // Plain object — same shape as Tiptap / ProseMirror getJSON()
        probe({
          body: {
            en: {
              type: 'doc',
              content: [
                {
                  type: 'image',
                  attrs: {
                    src: 'https://example.com/x.png',
                    alt: 'x',
                    title: null,
                    width: null,
                    height: null,
                  },
                },
              ],
            },
          },
        });
      }}
    >
      Send
    </button>
  );
}
```

## Expected behavior

The server receives the exact same object the client sent:

```js
{
  type: 'image',
  attrs: { src: 'https://example.com/x.png', alt: 'x', title: null, width: null, height: null }
}
```

## Actual behavior

The server receives the object with `attrs` present as a key but its value erased:

```js
// Object.getOwnPropertyDescriptor(img, 'attrs')
{ writable: true, enumerable: true, configurable: true }   // no value field — defaults to undefined

// JSON.stringify(img)
'{"type":"image"}'
```

The entire `attrs` sub-tree is gone — every author-supplied attribute (`src`, `alt`, `width`, `height`, `colspan`, `rowspan`, `href`, heading `level`, etc.) is lost.

## Symptom in our app

Real-world impact: an admin form uses Tiptap (with `outputFormat="json"`) to author rich content. Every saved post's image / link / heading / table-cell loses its attributes the moment it goes through a Server Action, so the public site renders blank `<img src="">`, hrefless anchors, and unstyled tables.

## What we ruled out before filing this

- Mongoose / MongoDB driver — confirmed plain-object inserts preserve `attrs` ✅
- NestJS ValidationPipe + class-validator + class-transformer — confirmed standalone tests preserve `attrs` ✅
- Zod schema (`z.object({type: z.literal('doc')}).passthrough()`) — confirmed standalone parse preserves `attrs` ✅
- Express body parser, httpClient `JSON.stringify`, fetch — all confirmed do not strip ✅
- Tiptap editor `editor.getJSON()` — confirmed emits full attrs in browser ✅
- React Hook Form value handling — confirmed `form.getValues()` and the data passed to `onSubmit` still hold full attrs in the browser ✅

Only the browser → Server Action boundary loses the value. The symptom is specific to the property literally named `attrs` (every other property on the same node — `type`, `content`, `marks`, plain text payloads — round-trips fine). Whether the loss is triggered by the literal name `attrs` or by some other shape characteristic of the values commonly carried under that key is something a Next.js maintainer is best placed to confirm by tracing the RSC encoder/decoder; our application-side workaround sidesteps it by sending the affected sub-tree as a string.

## Workaround

Marshall the body to a JSON string in the client and JSON.parse it back inside the server action:

```ts
// client (PostForm onSubmit)
if (data.body && typeof data.body === 'object') {
  data.bodySerialized = JSON.stringify(data.body);
  data._bodyIsStringified = true;
}
await createPost(data);
```

```ts
// server action
export async function createPost(data: any) {
  if (data._bodyIsStringified && typeof data.bodySerialized === 'string') {
    data.body = JSON.parse(data.bodySerialized);
    delete data.bodySerialized;
    delete data._bodyIsStringified;
  }
  // ... rest of the action
}
```

Strings round-trip through the RSC encoder cleanly so this restores the lost values.

## Files in this repo that demonstrate the fix

- `apps/core/src/staticModules/content/post/PostForm.tsx` — client-side stringification
- `apps/core/src/staticModules/content/common/actions/post.actions.ts` — server-side parse-back in `createPost` and `updatePost`
