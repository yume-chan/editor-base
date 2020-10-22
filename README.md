# Editor Base

Common building parts for any editor Apps.

- [Features](#features)
- [Development](#development)
  - [Install dependencies:](#install-dependencies)
  - [Testing](#testing)
  - [Coverage](#coverage)
- [License](#license)

## Features

* Mutable state to easily manipulate deeply nested objects
* Observe changes and auto re-render
* Action stack for partially editing
* Built-in undo redo support

## Development

This project uses [pnpm](https://pnpm.js.org/) ([GitHub](https://github.com/pnpm/pnpm)) to manage dependency packages.

### Install dependencies:

``` shell
pnpm i
```

You may also use `npm`, but the lockfile may become out of sync.

### Testing

``` shell
npm test
```

### Coverage

``` shell
npm run coverage
```

## License

MIT
