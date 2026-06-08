# @textyly/crossly-private-persistence-contracts

Shared TypeScript contracts for the Crossly **Private Persistence** service — the cross-stitch
pattern data model exchanged over its API plus the HATEOAS link shapes it returns.

These mirror the data model of `crossly.persistence.service` (the .NET app this service replaces)
and are meant to be consumed by clients such as [`crossly.ui`](https://github.com/textyly).

## Install

```bash
npm install @textyly/crossly-private-persistence-contracts
```

## Usage

```ts
import type {
    CrosslyDataModel,
    Link,
    GetAllResponse,
} from '@textyly/crossly-private-persistence-contracts';
```

The package ships only type declarations and has no runtime or server dependencies.

## License

Apache-2.0 — part of the [textyly / crossly](https://github.com/textyly) open-source project.
