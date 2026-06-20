export function validateUserRegistration({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (trimmedFirstName.length < 2) {
    throw new Error("Imię musi mieć co najmniej 2 znaki");
  }
  if (trimmedLastName.length < 2) {
    throw new Error("Nazwisko musi mieć co najmniej 2 znaki");
  }
  if (/\d/.test(trimmedFirstName)) {
    throw new Error("Imię nie może zawierać cyfr");
  }
  if (/\d/.test(trimmedLastName)) {
    throw new Error("Nazwisko nie może zawierać cyfr");
  }

  return {
    firstName: trimmedFirstName,
    lastName: trimmedLastName,
    email: normalizedEmail,
  };
}
