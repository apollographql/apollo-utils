import { print, type DocumentNode } from "graphql";

// This type is copied from `@apollo/client/link/persisted-queries`; to avoid a
// dependency on a particular version `@apollo/client` we copy it here.

type SHA256Function = (...args: any[]) => string | PromiseLike<string>;

export function generatePersistedQueryIdsAtRuntime(options: {
  sha256: SHA256Function;
}) {
  return {
    generateHash: (query: DocumentNode) =>
      Promise.resolve<string>(
        options.sha256(print(sortTopLevelDefinitions(query))),
      ),
    // Keep sending query IDs even if the other side doesn't know them.
    disable: () => false,
  };
}

// Sort the definitions in this document so that operations come before fragments,
// and so that each kind of definition is sorted by name.
export function sortTopLevelDefinitions(query: DocumentNode): DocumentNode {
  const definitions = [...query.definitions];
  // We want to avoid unnecessary dependencies, so write out a comparison
  // function instead of using _.orderBy.
  definitions.sort((a, b) => {
    // This is a reverse sort by kind, so that OperationDefinition precedes FragmentDefinition.
    if (a.kind > b.kind) {
      return -1;
    }
    if (a.kind < b.kind) {
      return 1;
    }

    // Extract the name from each definition. Jump through some hoops because
    // non-executable definitions don't have to have names (even though any
    // DocumentNode actually passed here should only have executable
    // definitions).
    const aName =
      a.kind === "OperationDefinition" || a.kind === "FragmentDefinition"
        ? a.name?.value ?? ""
        : "";
    const bName =
      b.kind === "OperationDefinition" || b.kind === "FragmentDefinition"
        ? b.name?.value ?? ""
        : "";

    // Sort by name ascending.
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }

    // Assuming that the document is "valid", no operation or fragment name can appear
    // more than once, so we don't need to differentiate further to have a deterministic
    // sort.
    return 0;
  });
  return {
    ...query,
    definitions,
  };
}

export function generatePersistedQueryIdsFromManifest(options: {
  manifest: { operations: { id: string; name: string }[] };
}) {
  const operationIdsByName = new Map<string, string>();
  options.manifest.operations.forEach(({ name, id }) => {
    operationIdsByName.set(name, id);
  });

  function generateHash(document: DocumentNode): string {
    let operationName: string | null = null;
    document.definitions.forEach((definition) => {
      if (definition.kind === "OperationDefinition") {
        if (!definition.name) {
          throw new Error(
            "Anonymous operations are not supported by usePersistedQueryIdsFromManifest",
          );
        }
        if (operationName !== null) {
          throw new Error(
            "Multi-operation GraphQL documents are not supported by usePersistedQueryIdsFromManifest",
          );
        }
        operationName = definition.name.value;
      }
    });
    if (operationName === null) {
      throw new Error(
        "Documents without operations are not supported by usePersistedQueryIdsFromManifest",
      );
    }
    const operationId = operationIdsByName.get(operationName);
    if (operationId === undefined) {
      throw new Error(`Operation ${operationName} not found in manifest`);
    }
    return operationId;
  }

  return {
    generateHash,
    // Keep sending query IDs even if the other side doesn't know them.
    disable: () => false,
  };
}
