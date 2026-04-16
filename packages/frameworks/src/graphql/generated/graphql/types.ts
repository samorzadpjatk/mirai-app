export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Arbitrary precision integer */
  BigInt: { input: any; output: any; }
  /** ISO 8601 date time string */
  DateTime: { input: Date; output: Date; }
  /** RFC 5322 compliant email address */
  EmailAddress: { input: any; output: any; }
  /** Arbitrary JSON object */
  JSONObject: { input: any; output: any; }
  /** RFC 3986 compliant URL */
  URL: { input: any; output: any; }
  /** Universally unique identifier */
  UUID: { input: any; output: any; }
};

/** A coin transaction in the system */
export type CoinTransaction = {
  __typename?: 'CoinTransaction';
  admin?: Maybe<CoinTransactionAdmin>;
  adminId?: Maybe<Scalars['ID']['output']>;
  amount?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  group?: Maybe<CoinTransactionGroup>;
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** Admin information for a coin transaction */
export type CoinTransactionAdmin = {
  __typename?: 'CoinTransactionAdmin';
  firstName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
};

/** A connection of coin transactions for Relay pagination */
export type CoinTransactionConnection = {
  __typename?: 'CoinTransactionConnection';
  edges?: Maybe<Array<CoinTransactionEdge>>;
  nodes?: Maybe<Array<CoinTransaction>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a coin transaction connection */
export type CoinTransactionEdge = {
  __typename?: 'CoinTransactionEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<CoinTransaction>;
};

/** Group information for a coin transaction */
export type CoinTransactionGroup = {
  __typename?: 'CoinTransactionGroup';
  coins?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** An event in the system */
export type Event = {
  __typename?: 'Event';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdById?: Maybe<Scalars['ID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['DateTime']['output']>;
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  maxParticipants?: Maybe<Scalars['Int']['output']>;
  startTime?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of events for Relay pagination */
export type EventConnection = {
  __typename?: 'EventConnection';
  edges?: Maybe<Array<EventEdge>>;
  nodes?: Maybe<Array<Event>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in an event connection */
export type EventEdge = {
  __typename?: 'EventEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Event>;
};

/** A notification in the system */
export type Notification = {
  __typename?: 'Notification';
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdById?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  priority?: Maybe<Scalars['String']['output']>;
  scheduledAt?: Maybe<Scalars['DateTime']['output']>;
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of notifications for Relay pagination */
export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  edges?: Maybe<Array<NotificationEdge>>;
  nodes?: Maybe<Array<Notification>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a notification connection */
export type NotificationEdge = {
  __typename?: 'NotificationEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Notification>;
};

/** PageInfo for Relay-compliant pagination */
export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** Root Query type */
export type Query = {
  __typename?: 'Query';
  coinTransactions?: Maybe<CoinTransactionConnection>;
  eventsByTrip?: Maybe<EventConnection>;
  notificationsByUser?: Maybe<NotificationConnection>;
  ongoingEventsByTrip?: Maybe<EventConnection>;
  pastEventsByTrip?: Maybe<EventConnection>;
  sponsors?: Maybe<SponsorConnection>;
  sponsorsByTrip?: Maybe<TripSponsorConnection>;
  unreadNotificationsByUser?: Maybe<NotificationConnection>;
  upcomingEventsByTrip?: Maybe<EventConnection>;
  users?: Maybe<UserConnection>;
  usersByRole?: Maybe<UserConnection>;
};


/** Root Query type */
export type QueryCoinTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  groupId?: InputMaybe<Scalars['ID']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryEventsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryNotificationsByUserArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryOngoingEventsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryPastEventsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QuerySponsorsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QuerySponsorsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryUnreadNotificationsByUserArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryUpcomingEventsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QueryUsersByRoleArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  role: Scalars['String']['input'];
};

/** A sponsor in the system */
export type Sponsor = {
  __typename?: 'Sponsor';
  contactEmail?: Maybe<Scalars['String']['output']>;
  contactPhone?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  logoUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  websiteUrl?: Maybe<Scalars['String']['output']>;
};

/** A connection of sponsors for Relay pagination */
export type SponsorConnection = {
  __typename?: 'SponsorConnection';
  edges?: Maybe<Array<SponsorEdge>>;
  nodes?: Maybe<Array<Sponsor>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a sponsor connection */
export type SponsorEdge = {
  __typename?: 'SponsorEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Sponsor>;
};

/** A sponsor linked to a trip */
export type TripSponsor = {
  __typename?: 'TripSponsor';
  benefits?: Maybe<Scalars['String']['output']>;
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  linkedAt?: Maybe<Scalars['DateTime']['output']>;
  linkedById?: Maybe<Scalars['ID']['output']>;
  sponsor?: Maybe<Sponsor>;
  sponsorId?: Maybe<Scalars['ID']['output']>;
  tier?: Maybe<Scalars['String']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of trip sponsors for Relay pagination */
export type TripSponsorConnection = {
  __typename?: 'TripSponsorConnection';
  edges?: Maybe<Array<TripSponsorEdge>>;
  nodes?: Maybe<Array<TripSponsor>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a trip sponsor connection */
export type TripSponsorEdge = {
  __typename?: 'TripSponsorEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<TripSponsor>;
};

/** A user in the system */
export type User = {
  __typename?: 'User';
  authUserId?: Maybe<Scalars['ID']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  birthDate?: Maybe<Scalars['DateTime']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dietaryRequirements?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  medicalInfo?: Maybe<Scalars['String']['output']>;
  nickname?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  shirtSize?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of users for Relay pagination */
export type UserConnection = {
  __typename?: 'UserConnection';
  edges?: Maybe<Array<UserEdge>>;
  nodes?: Maybe<Array<User>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a user connection */
export type UserEdge = {
  __typename?: 'UserEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<User>;
};
