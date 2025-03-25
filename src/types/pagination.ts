
export type PaginatedData<T> = {
    list: T[];
    metadata: {count: number, hasNextPage: boolean, cursor?: string},
};

// list is a generic type T, which is only one item, but that becomes an array on list property.

