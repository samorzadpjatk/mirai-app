'use client'
import dynamic from "next/dynamic";
import { Box, Card, Heading } from "@radix-ui/themes";

const PDFViewer = dynamic(() => import("../../components/map/PDFViewer"), { ssr: false });

export default function MapPage() {
  return (
    <Box mt="5" className="flex flex-col items-center w-full">
      <Card className="w-full md:w-[48rem] p-4 flex flex-col items-center gap-4" size="3">
        <Heading size={{ initial: "7" }} style={{ fontFamily: "var(--font-robotoslab)" }}>
          Map Viewer
        </Heading>

        <PDFViewer />
      </Card>
    </Box>
  );
}
