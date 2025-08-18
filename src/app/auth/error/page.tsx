"use client"
 

import { Card, Heading, Button, Flex, Separator } from "@radix-ui/themes";
import { useSearchParams } from "next/navigation"
 
export default function AuthErrorPage() {
  const search = useSearchParams()
  const errorCode = search.get("error")
  const errorDescriptions: Record<string, string> = {
    Configuration: "Błąd konfiguracji uwierzytelniania. Skontaktuj się z administratorem.",
    AccessDenied: "Dostęp został odrzucony. Upewnij się, że masz odpowiednie uprawnienia.",
    Verification: "Weryfikacja nie powiodła się. Spróbuj ponownie lub skontaktuj się z nami.",
    OAuthCallback: "Błąd podczas powrotu z zewnętrznego dostawcy. Spróbuj ponownie.",
    Default: "Wystąpił nieznany błąd logowania. Skontaktuj się z nami, jeśli problem się powtarza."
  }

  const description = errorCode ? (errorDescriptions[errorCode] ?? errorDescriptions.Default) : null

  let details = null
  if (errorCode) {
    details = (
      <div>
        <div>
          <b>Kod błędu:</b>{" "}
          <code className="rounded-sm bg-slate-100 p-1 text-xs">{errorCode}</code>
        </div>
        <div style={{ marginTop: 8 }}>
          <b>Opis:</b>{" "}{description}
        </div>
      </div>
    )
  }
 
  return (
    <Flex direction="column" align="center" justify="center" className="h-screen w-full">
      <Card size="3" style={{ maxWidth: 400, width: "100%" }}>
        <Heading size="4" mb="4">Coś poszło nie tak</Heading>
        <Separator my="3" size="2" />
        <div style={{ marginBottom: 16 }}>
          {details ?? errorDescriptions.Default}
        </div>
        <Button asChild variant="solid" color="blue" style={{ width: '100%' }}>
          <a href="/auth/login">Powrót do logowania</a>
        </Button>
      </Card>
    </Flex>
  )
}