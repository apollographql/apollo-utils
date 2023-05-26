import { print, type DocumentNode } from "graphql";
import { ApolloLink } from "@apollo/client/link/core";

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

export interface GeneratePersistedQueryIdsFromManifestOptions {
  manifest: { operations: { id: string; name: string }[] };
}
export function generatePersistedQueryIdsFromManifest(
  options: GeneratePersistedQueryIdsFromManifestOptions,
) {
  const operationIdsByName = new Map<string, string>();
  options.manifest.operations.forEach(({ name, id }) => {
    operationIdsByName.set(name, id);
  });

  function generateHash(document: DocumentNode): string {
    let operationName: string | null = null;
    for (const definition of document.definitions) {
      if (definition.kind === "OperationDefinition") {
        if (!definition.name) {
          throw new Error(
            "Anonymous operations are not supported by generatePersistedQueryIdsFromManifest",
          );
        }
        if (operationName !== null) {
          throw new Error(
            "Multi-operation GraphQL documents are not supported by generatePersistedQueryIdsFromManifest",
          );
        }
        operationName = definition.name.value;
      }
    }
    if (operationName === null) {
      throw new Error(
        "Documents without operations are not supported by generatePersistedQueryIdsFromManifest",
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

export interface CreatePersistedQueryManifestVerificationLinkOptions {
  manifest: { operations: { name: string; body: string }[] };
  onAnonymousOperation?: (options: { body: string }) => void;
  onMultiOperationDocument?: (options: { body: string }) => void;
  onNoOperationsDocument?: (options: { body: string }) => void;
  onUnknownOperationName?: (options: {
    operationName: string;
    body: string;
  }) => void;
  onDifferentBody?: (options: {
    operationName: string;
    manifestBody: string;
    actualBody: string;
  }) => void;
}
export function createPersistedQueryManifestVerificationLink(
  options: CreatePersistedQueryManifestVerificationLinkOptions,
) {
  const operationBodiesByName = new Map<string, string>();
  options.manifest.operations.forEach(({ name, body }) => {
    operationBodiesByName.set(name, body);
  });

  function checkDocument(document: DocumentNode) {
    const body = print(sortTopLevelDefinitions(document));

    let operationName: string | null = null;
    for (const definition of document.definitions) {
      if (definition.kind === "OperationDefinition") {
        if (!definition.name) {
          options.onAnonymousOperation?.({ body });
          return;
        }
        if (operationName !== null) {
          options.onMultiOperationDocument?.({ body });
          return;
        }
        operationName = definition.name.value;
      }
    }
    if (operationName === null) {
      options.onNoOperationsDocument?.({ body });
      return;
    }
    const manifestBody = operationBodiesByName.get(operationName);
    if (manifestBody === undefined) {
      options.onUnknownOperationName?.({ operationName, body });
      return;
    }

    if (body !== manifestBody) {
      options.onDifferentBody?.({
        operationName,
        manifestBody,
        actualBody: body,
      });
      return;
    }
  }

  return new ApolloLink((operation, forward) => {
    checkDocument(operation.query);
    return forward(operation);
  });
}
