import { renderRouter, screen } from "expo-router/testing-library";

/**
 * Renders a component with Expo Router testing utilities
 *
 * This helper uses expo-router/testing-library's renderRouter for testing
 * navigation-aware components. It provides:
 * - In-memory router with mocked file system
 * - Custom matchers like toHavePathname(), toHaveSegments()
 * - Integration with React Native Testing Library's screen
 *
 * @see https://docs.expo.dev/router/reference/testing/
 *
 * @example
 * // Test a simple route
 * renderRouter({
 *   index: () => <Text>Home Screen</Text>
 * });
 * expect(screen).toHavePathname('/');
 *
 * @example
 * // Test with initial URL
 * renderRouter(
 *   { index: HomeScreen, 'trip/[id]': TripScreen },
 *   { initialUrl: '/trip/123' }
 * );
 * expect(screen).toHavePathname('/trip/123');
 */
export { renderRouter, screen };

/**
 * Example: Testing a navigation component
 *
 * describe('Navigation', () => {
 *   it('navigates to trip details', () => {
 *     const MockTripScreen = jest.fn(() => <Text>Trip Details</Text>);
 *
 *     renderRouter(
 *       {
 *         index: () => <Button title="Go to Trip" onPress={() => router.push('/trip/123')} />,
 *         'trip/[id]': MockTripScreen,
 *       },
 *       { initialUrl: '/' }
 *     );
 *
 *     fireEvent.press(screen.getByText('Go to Trip'));
 *     expect(screen).toHavePathname('/trip/123');
 *     expect(MockTripScreen).toHaveBeenCalled();
 *   });
 * });
 */
