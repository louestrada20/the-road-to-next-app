"use client"
import {useQueryState, useQueryStates} from "nuqs";
import {useEffect, useRef} from "react";
import {Pagination} from "@/components/pagination/pagination";
import {paginationOptions, paginationParser, searchParser} from "@/features/ticket/search-params";
import {TicketWithMetaData} from "@/features/ticket/types/types";
import {PaginatedData} from "@/types/pagination";

type TicketPaginationProps = {
    paginatedTicketMetadata: PaginatedData<TicketWithMetaData>["metadata"]
};


const TicketPagination = ({paginatedTicketMetadata}: TicketPaginationProps) => {
    const [pagination, setPagination] = useQueryStates(paginationParser, paginationOptions);
    const [search] = useQueryState("search",  searchParser);

    const prevSearch = useRef(search);

    useEffect( () =>  {
        const handleSearchPagination = async () => {
        if (search === prevSearch.current) return
        prevSearch.current = search
        await setPagination({...pagination, page: 0})
        }
        handleSearchPagination();

        // add more reactive effects here once needed.
    }, [search, pagination, setPagination]);

    return <Pagination  paginatedMetadata={paginatedTicketMetadata} pagination={pagination} onPagination={setPagination} />;
}

export { TicketPagination }