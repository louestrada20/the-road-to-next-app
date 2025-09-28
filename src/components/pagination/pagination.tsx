import {Button} from "@/components/ui/button";
import {PAGE_SIZES} from "@/components/pagination/constants";   
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {PaginatedData} from "@/types/pagination";
import { useTransition } from "react";  

type PageAndSize = {
    page: number;
    size: number;
}

type PaginationProps = {
    pagination: PageAndSize;
    onPagination: (pagination: PageAndSize) => void;
    paginatedMetadata: PaginatedData<unknown>["metadata"]
}
const Pagination = ({pagination, onPagination, paginatedMetadata: {count, hasNextPage}}: PaginationProps) => {
    const startOffset = pagination.page * pagination.size + 1;
    const actualStartOffset = count < 1 ? 0 : startOffset;
    const endOffset = startOffset - 1 + pagination.size;
    const actualEndOffset = Math.min(endOffset, count);

    const label = `${actualStartOffset} - ${actualEndOffset} of ${count}`;

    const [isPending, startTransition] = useTransition();

    const handleNextPage = () => {
        startTransition(() => {
            onPagination({...pagination, page: pagination.page + 1})    
        })
    }
    const handlePreviousPage = () => {
        startTransition(() => {
            onPagination({...pagination, page: pagination.page - 1})
        })
    }
    const previousButton = (
        <Button variant="outline" size="sm" disabled={pagination.page < 1 || isPending} onClick={handlePreviousPage}>
            Previous
        </Button>
    )

    const nextButton = (
        <Button variant="outline" size="sm"
               disabled={!hasNextPage || isPending}
                onClick={handleNextPage}>
            Next
        </Button>
    )

    const handleSizeChange = (size: string) => {
        onPagination({page: 0, size: parseInt(size)})
    }

    const sizeSelect = (
        <Select onValueChange={handleSizeChange} defaultValue={pagination.size.toString()}>
            <SelectTrigger >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )


    return (
        <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{label}</p>

        <div className="flex gap-x-2">
           <span className="text-sm text-muted-foreground">Per page:</span> {sizeSelect}
            {previousButton}
            {nextButton}
        </div>
        </div>
    )
}

export { Pagination }