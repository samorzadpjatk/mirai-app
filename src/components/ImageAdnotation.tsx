import { Callout } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const ImageAdnotation = () => {
    return (
        <Callout.Root size={{"initial":"1"}} variant="surface" style={{ margin: '1rem' }}>
            <Callout.Icon>
                <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text size={{'initial': "1"}}>
                Photo by <Link href="https://unsplash.com/@karljkhedin?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Karl Hedin</Link> on <Link href="https://unsplash.com/photos/a-stone-castle-on-a-hill-kdnTKiEZ-90?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</Link>
            </Callout.Text>
        </Callout.Root>
    );
};

export default ImageAdnotation;
