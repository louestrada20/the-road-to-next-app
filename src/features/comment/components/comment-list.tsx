"use client"
import {useInfiniteQuery, useQueryClient} from "@tanstack/react-query";
import {useEffect} from "react";
import {useInView} from "react-intersection-observer";
import {CardCompact} from "@/components/card-compact";
import {Skeleton} from "@/components/ui/skeleton";
import {CommentCreateForm} from "@/features/comment/components/comment-create-form";
import {CommentDeleteButton} from "@/features/comment/components/comment-delete-button";
import { CommentItem} from "@/features/comment/components/comment-item";
import {getComments} from "@/features/comment/queries/get-comments";
import {CommentWithMetadata} from "@/features/comment/types";
import {PaginatedData} from "@/types/pagination";


type CommentListProps = {
    ticketId: string,
    paginatedComments: PaginatedData<CommentWithMetadata>,
}

const CommentList =  ({ticketId, paginatedComments }: CommentListProps )=> {
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

    const handleDeleteComment = () => queryClient.invalidateQueries({queryKey});
    const handleCreateComment = () => queryClient.invalidateQueries({queryKey});
    const {ref, inView} = useInView();
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, inView, isFetchingNextPage, hasNextPage]
    );


    return (
        <>
                <CardCompact title="Create Comment"
                             description="Have a comment about the ticket?"
                             content={<CommentCreateForm ticketId={ticketId} onCreateComment={handleCreateComment}/>}/>
            <div className=" flex flex-col gap-y-2 ml-8 mt-4">
                {(comments.map((comment) =>
                        <CommentItem key={comment.id}
                                     comment={comment}
                                     buttons={[
                                         ...(comment.isOwner
                                             ? [<CommentDeleteButton key="0" id={comment.id} onDeleteComment={handleDeleteComment} />]
                                             : [])]}
                        />
                    ))}
            </div>
            <div className=" flex flex-col justify-center ml-8">
                <div ref={ref}>{!hasNextPage && (<p className="text-right text-sm italic">No more comments...</p>)}</div>
                {isFetchingNextPage && (
                    <>
                    <Skeleton className="h-[70px] w-[500px]" />
                    <Skeleton className="h-[70px] w-[500px]" />
                    </>
                )}
            </div>
        </>
    )
}

export {CommentList}