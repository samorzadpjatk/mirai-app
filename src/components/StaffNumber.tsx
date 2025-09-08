import { MobileIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";
import Link from "next/link";

const StaffNumber = () => {
    return (<Callout.Root size={"1"} color={"red"} variant={"surface"}>
        <Callout.Icon>
            <MobileIcon />
        </Callout.Icon>
        <Callout.Text>
            Staff number: <Link href={"tel:+48734095706"}>+48 734 095 706</Link>
        </Callout.Text>
    </Callout.Root>)
}

export default StaffNumber;