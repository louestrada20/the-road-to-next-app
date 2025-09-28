import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { PaginatedData } from "@/types/pagination";
import { getComments } from "../../queries/get-comments";
import { CommentWithMetadata } from "../../types";


export const usePaginatedComments = (ticketId: string, paginatedComments: PaginatedData<CommentWithMetadata>) => {
 
    const queryKey = ["comments", ticketId];
    const {data, fetchNextPage, hasNextPage, isFetchingNextPage} = useInfiniteQuery({
        queryKey,
        queryFn: ({pageParam}) => getComments(ticketId, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastpage) =>
            lastpage.metadata.hasNextPage ? lastpage.metadata.cursor : undefined,
        initialData: {
            pages: [
                {
                    list: paginatedComments.list,
                    metadata: paginatedComments.metadata,
                },
            ],
            pageParams: [undefined],
        }
    });
    
    const comments = data?.pages.flatMap(page => page.list);
    const queryClient = useQueryClient();

    const onCreateComment = () => queryClient.invalidateQueries({queryKey});
    const onDeleteComment = () => queryClient.invalidateQueries({queryKey});
    const onDeleteAttachment = () => queryClient.invalidateQueries({queryKey});
    const onCreateAttachment = () => queryClient.invalidateQueries({queryKey});

    return {
        comments,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        onCreateComment,
        onDeleteComment,        
        onDeleteAttachment,
        onCreateAttachment,
    }
}