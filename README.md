# GEFF Folder Validator

A simple web application for validating and analyzing GEFF folder structures
with drag-and-drop functionality.

This is an experimental page associated with the Graph Exchange File Format
(GEFF).  See [official
documentation](https://live-image-tracking-tools.github.io/geff/latest/) for
details on the spec, and the [`geff`
repository](https://github.com/live-image-tracking-tools/geff) for schema and
reference python implementation.

## Development

### Prerequisites

- Node.js 16.0.0 or higher

### Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## How It Works

1. **Drop Zone**: Users can drag zarr folders or click to browse
2. **File Processing**: The app traverses directory structures
3. **Validation**: Checks for zarr metadata files (`.zarray`, `.zgroup`, `.zmetadata`)
4. **Display**: Shows validation results and folder information

## Extending the Validator

The validation logic is in `src/js/zarrValidator.js`. You can extend the `validateZarrStructure` function to add more sophisticated zarr format validation rules.
