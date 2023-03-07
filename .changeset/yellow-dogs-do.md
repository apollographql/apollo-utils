---
"@apollo/utils.keyvadapter": patch
---

Fix issue with KeyvAdapter where `Keyv.getMany` returns `undefined`,
causing `KeyvAdapter` to violate the `DataLoader` contract.

DataLoader always expects a `Promise<Array<V>>` having the same length
as the `keys` that were given to it. This problem stems from a
shortcoming of the `Keyv` typings, since it doesn't declare that a
`get([...keys])` can return a singular `undefined` (but it can in
the case of errors / `Store.getMany` can return a singular `undefined`).
