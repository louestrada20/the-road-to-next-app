import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {PaginatedData} from "@/types/pagination";

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

    const handleNextPage = () => {
        onPagination({...pagination, page: pagination.page + 1})
    }
    const handlePreviousPage = () => {
        onPagination({...pagination, page: pagination.page - 1})
    }
    const previousButton = (
        <Button variant="outline" size="sm" disabled={pagination.page < 1} onClick={handlePreviousPage}>
            Previous
        </Button>
    )

    const nextButton = (
        <Button variant="outline" size="sm"
               disabled={!hasNextPage}
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
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
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