import { MobileIcon } from "@radix-ui/react-icons";
import { Card, Flex, Link, Text } from "@radix-ui/themes";


const StaffNumber = () => {
    return (<Card size={"1"}>
        <Flex align={"center"} width={"100%"} justify={"start"} gap="2">
            <MobileIcon />
            <Text >
                Staff number: <Link underline="always" href={"tel:+48734095706"}>+48 734 095 706</Link>
            </Text>
        </Flex>
    </Card>)
}

export default StaffNumber;