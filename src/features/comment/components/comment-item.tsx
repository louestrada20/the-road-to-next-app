
import {format} from "date-fns"
import {Card} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {CommentWithMetadata} from "@/features/comment/types";
import Content from "@/components/content";

type CommentItemProps = {
    comment: CommentWithMetadata,
    buttons: React.ReactNode[],
    sections: {label: string, content: React.ReactNode}[]
}
const CommentItem = ({comment, buttons, sections}: CommentItemProps) => {
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
            <Content>
                {content}
            </Content>
            {sections.map((section) => (
                <div key={section.label} className="space-y-2 mt-2">
                    <Separator />
                    <h4 className="text-sm text-muted-foreground">{section.label}</h4>
                   <div> {section.content}</div>
                </div>
            ))}
        </Card>
            <div className="flex flex-col gap-y-1">
                {buttons}
            </div>
        </div>
    )
}

export {CommentItem}