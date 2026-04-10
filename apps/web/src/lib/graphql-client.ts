import { GraphQLClient } from "graphql-request";
import { env } from "./env";

const getAuthToken = (): string | null => {
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((c) =>
    c.trim().startsWith("sb-access-token="),
  );
  return tokenCookie ? tokenCookie.split("=")[1] : null;
};

export const graphqlClient = new GraphQLClient(env.graphqlUrl, {
  headers: () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
