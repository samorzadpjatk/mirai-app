import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { useState } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import useDebounce from '../debounce'

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return initial value immediately and update after delay when prop changes', async () => {
        const Test = ({ delay }: { delay: number }) => {
            const [value, setValue] = useState('initial')
            const [debounced] = useDebounce(value, delay)
            return <>
                <input data-testid="input" value={value} onChange={e => setValue(e.target.value)} />
                <div data-testid="out">{debounced}</div>
            </>
        }

        render(<Test delay={500} />)
        
        const out = screen.getByTestId('out')
        expect(out.textContent).toBe('initial')

        // change the input value
        const input = screen.getByTestId('input')
        act(() => {
            fireEvent.change(input, { target: { value: 'changed' } })
        })
        // still old value before timer
        expect(out.textContent).toBe('initial')

        // advance timers by delay and run pending timers
        act(() => {
            vi.advanceTimersByTime(500)
        })

        expect(out.textContent).toBe('changed')
    })
})
