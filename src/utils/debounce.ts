import { useState, useEffect } from "react"

export default function useDebounce<T>(value: T, delay: number): [T, (value: T) => void] {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return [debouncedValue, setDebouncedValue] as const
}