
import {format} from "date-fns"
import {Card} from "@/components/ui/card";
import {CommentWithMetadata} from "@/features/comment/types";

type CommentItemProps = {
    comment: CommentWithMetadata,
    buttons: React.ReactNode[]
}
const CommentItem = ({comment, buttons}: CommentItemProps) => {
    const {content} = comment;
    return (
        <div className="flex gap-x-2">
        <Card className=" p-4 flex-1 flex flex-col gap-y-1">
            <div className="flex justify-between">
                <p className=" text-sm text-muted-foreground">
                    {comment.user?.username ?? "Deleted User"}
                </p>
                    <p className=" text-sm text-muted-foreground">
                        {format(comment.createdAt, "yyyy-MM-dd, HH:mm")}
                    </p>
            </div>
            <p className="whitespace-pre-line">
                {content}
            </p>
        </Card>
            <div className="flex flex-col gap-y-1">
                {buttons}
            </div>
        </div>
    )
}

export {CommentItem}