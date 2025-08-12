"use client"
 

import { Card, Heading, Button, Flex, Separator } from "@radix-ui/themes";
import { useSearchParams } from "next/navigation"
 
enum Error {
  Configuration = "Configuration",
}
 
const errorMap = {
  [Error.Configuration]: (
    <p>
      There was a problem when trying to authenticate. Please contact us if this
      error persists. Unique error code:{" "}
      <code className="rounded-sm bg-slate-100 p-1 text-xs">Configuration</code>
    </p>
  ),
}
 
export default function AuthErrorPage() {
  const search = useSearchParams()
  const error = search.get("error") as Error
 
  return (
    <Flex direction="column" align="center" justify="center" className="h-screen w-full">
      <Card size="3" style={{ maxWidth: 400, width: "100%" }}>
        <Heading size="4" mb="4">Coś poszło nie tak</Heading>
        <Separator my="3" size="2" />
        <div style={{ marginBottom: 16 }}>
          {errorMap[error] || "Skontaktuj się z nami, jeśli błąd się powtarza."}
        </div>
        <Button asChild variant="solid" color="blue" style={{ width: '100%' }}>
          <a href="/auth/login">Powrót do logowania</a>
        </Button>
      </Card>
    </Flex>
  )
}