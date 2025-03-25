"use client"
import {useDebouncedCallback} from "use-debounce"
import {Input} from "@/components/ui/input";

type SearchInputProps = {
    placeholder: string;
    value: string,
    onChange: (value: string) => void,
}

const SearchInput = ({value, onChange, placeholder}: SearchInputProps) => {
    const handleSearch = useDebouncedCallback(async(event: React.ChangeEvent<HTMLInputElement>) => {
       onChange(event.target.value);
    }, 250)

    return <Input defaultValue={value} placeholder={placeholder} onChange={handleSearch} ></Input>

}

export {SearchInput}