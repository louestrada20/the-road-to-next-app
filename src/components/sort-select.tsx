"use client"
import { useQueryStates} from "nuqs";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {sortOptions, sortParser} from "@/features/ticket/search-params";


export type SortSelectOption = {
    label: string;
    sortValue: string;
    sortKey: string;
}
type SortObject = {
    sortKey: string;
    sortValue: string;
}

export type SortSelectProps = {
    options: SortSelectOption[];
    value: SortObject;
    onChange: (sort: SortObject) => void;
}

const SortSelect = ({ value, onChange, options}: SortSelectProps) => {

    const handleSort = async (compositeKey: string) => {
        const [sortKey, sortValue] = compositeKey.split("_")
        onChange({
           sortKey,
          sortValue
       })
    }

    return (
        <Select defaultValue={value.sortKey + "_" + value.sortValue} onValueChange={handleSort} >
            <SelectTrigger >
                <SelectValue  />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (<SelectItem key={option.sortKey + option.sortValue} value={`${option.sortKey}_${option.sortValue}`}>{option.label}</SelectItem>))}
            </SelectContent>
        </Select>
    )

}

export {SortSelect}