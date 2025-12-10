"use client"

import { ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

const RefreshButton = () => {
    const router = useRouter();
    return (
        <Button
            variant="soft"
            onClick={() => router.refresh()}
        >
            <ReloadIcon />
            Refresh
        </Button>
    );
}

export default RefreshButton;
