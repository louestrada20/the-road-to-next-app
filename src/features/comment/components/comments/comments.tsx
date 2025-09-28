"use client"
                    
import {useEffect} from "react";
import {useInView} from "react-intersection-observer";
import {CardCompact} from "@/components/card-compact";
import {Skeleton} from "@/components/ui/skeleton";
import {CommentCreateForm} from "@/features/comment/components/comment-create-form";        
import {CommentWithMetadata} from "@/features/comment/types";
import {PaginatedData} from "@/types/pagination";
import { CommentList } from "../comment-list";
import { usePaginatedComments } from "./use-paginated-comments";


type CommentsProps = {
    ticketId: string,
    paginatedComments: PaginatedData<CommentWithMetadata>,
}

const Comments =  ({ticketId, paginatedComments }: CommentsProps )=> {

    // we extracted from this component the comment list and in the comment list component we render comment item. 
    // This is so that we can keep our components lightweight.
    // this component does not just render commentlist, but also handles the pagination and the creation of comments via the comment create form.
    // once components grow in size, we can extract to things like a main component, a list component, and an item component.
    
    const {ref, inView} = useInView();
    const {comments, onCreateComment, onDeleteComment, fetchNextPage, hasNextPage, isFetchingNextPage, onDeleteAttachment } = usePaginatedComments(ticketId, paginatedComments);
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
                             content={<CommentCreateForm ticketId={ticketId} onCreateComment={onCreateComment}/>}/>
            <div className=" flex flex-col gap-y-2 ml-8 mt-4">
                <CommentList comments={comments} onDeleteComment={onDeleteComment} onDeleteAttachment={onDeleteAttachment} />
            </div>
            <div className=" flex flex-col justify-center ml-8">
                <div ref={ref}>{!hasNextPage && (<p className="text-right text-sm italic">No more comments...</p>)}</div>
                {isFetchingNextPage && (
                    <>
                    <Skeleton className="h-[80px] w-[540px]  mt-2" />
                    <Skeleton className="h-[80px] w-[540px]  mt-2" />
                    </>
                )}
            </div>
        </>
    )
}

export {Comments}