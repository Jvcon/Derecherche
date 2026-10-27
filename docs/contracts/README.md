# Contracts

This directory holds behavior contracts that multiple hosts must share.

- [Picker interaction contract](picker-contract.md) — InlineBar, SelectionBar, Palette, keyboard flow, category navigation, recommendation behavior, open modes.

Data schemas are canonical in [`packages/data/schema`](../../packages/data/schema):

- [`categories.schema.json`](../../packages/data/schema/categories.schema.json)
- [`providers.schema.json`](../../packages/data/schema/providers.schema.json)
- [`engines.schema.json`](../../packages/data/schema/engines.schema.json)
- [`sites.schema.json`](../../packages/data/schema/sites.schema.json)

The schemas describe the data shape. The picker contract describes how the data is used. Keep them separate: a data change should not require rewriting interaction behavior, and an interaction change should not require editing the catalog.
