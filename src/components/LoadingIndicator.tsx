"use client"

import { LoopIcon } from '@radix-ui/react-icons'
import { Callout } from '@radix-ui/themes'
import { useLinkStatus } from 'next/link'

const LoadingIndicator = () => {
    const { pending } = useLinkStatus()
    return pending ? (
        <Callout.Root size={"3"} variant={"outline"}>
            <Callout.Icon><LoopIcon /></Callout.Icon>
            <Callout.Text>Loading...</Callout.Text>
        </Callout.Root>
    ) : null
}

export default LoadingIndicator;