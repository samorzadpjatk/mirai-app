import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";

const getAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync("sb-access-token");
};

export const graphqlClient = new GraphQLClient(
  process.env.EXPO_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql",
  {
    headers: async () => {
      const token = await getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  },
);
