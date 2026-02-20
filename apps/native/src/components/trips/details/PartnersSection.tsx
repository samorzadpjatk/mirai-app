import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "~/styles";
import aiseclabLogo from "../../../../assets/partners/aiseclab.png";
import orangeLogo from "../../../../assets/partners/orange.png";
import netcompanyLogo from "../../../../assets/partners/netcompany.png";
import comtegraLogo from "../../../../assets/partners/comtegra.png";

export interface Partner {
  id: string;
  name: string;
  logo: ImageSourcePropType;
  description: string;
  height?: number;
  offsetX?: number;
  offsetY?: number;
}

const PARTNERS: Partner[] = [
  {
    id: "partner-2",
    name: "AiSECLAB - AI-driven cybersecurity",
    logo: aiseclabLogo,
    description:
      "AiSECLAB to polska firma tworząca zaawansowane oprogramowanie z obszaru cyberbezpieczeństwa. Wykorzystuje sztuczną inteligencję do wykrywania zagrożeń, analizy ryzyka i ochrony systemów informatycznych i kontroli wycieku treści w czasie rzeczywistym. Z systemów AiSECLAB korzystają m.in. Policja Polska, Mattel, NASK PIB\n\nAiSECLAB już drugi rok z rzędu wspiera Samorząd Przyszłości PJATK! W ubiegłym i w tym roku firma w całości sfinansowała zakup kamizelek narciarskich dla uczestników wyjazdu. Dzięki nim możemy poczuć się jako jedna społeczność i zawsze znajdziemy się na stoku.\n\nA to nie koniec współpracy — w semestrze letnim na PJATK odbędą się wyjątkowe wykłady i warsztaty prowadzone przez ekspertów AiSECLAB, poświęcone zastosowaniu sztucznej inteligencji w cyberbezpieczeństwie.\n\nDziękujemy AiSECLAB za ciągłą współpracę i wsparcie społeczności studenckiej PJATK!",
    height: 30,
  },
  {
    id: "partner-1",
    name: "Orange",
    logo: orangeLogo,
    description:
      "Orange Flex to marka stworzona z myślą o studentach. To właśnie studenci potrzebują elastyczności najbardziej. Flex daje wolność wyboru i dopasowania usług do własnego stylu życia, bez zbędnych zobowiązań.\n\nDzięki współpracy z Orange Flex każdy uczestnik wyjazdu otrzymuje 3 miesiące bezpłatnego numeru w Polsce, a na czas pobytu w górach także 10 GB internetu w Szwajcarii. Żeby nic Cię nie ominęło, nawet za granicą!\n\nBardzo dziękujemy Orange Flex za zaufanie i wsparcie. Mamy nadzieję, że to dopiero początek większej współpracy!",
    height: 18,
  },
  {
    id: "partner-3",
    name: "Netcompany",
    logo: netcompanyLogo,
    description:
      "Netcompany to międzynarodowa firma IT z siedzibą w Kopenhadze, będąca jednym z liderów cyfrowej transformacji w Europie. Dostarcza kompleksowe rozwiązania technologiczne dla sektora publicznego i prywatnego, zatrudniając ponad 7 800 specjalistów w ponad 12 krajach.\n\nNetcompany obdarzyło nas swoim zaufaniem, stając się oficjalnym Sponsorem Samorządu Przyszłości PJATK i wspierając liczne inicjatywy, które ujrzą światło dzienne w semestrze letnim. Na wyjazd WINTEGRAL Netcompany ufundowało nagrody dla zwycięzców konkursów w aplikacji, a oprócz tego dofinansowało uczestnikom wyjście na Zipline, Fondue Evening oraz Raclette — czyli najbardziej wyczekiwane atrakcje tego wyjazdu!\n\nDziękujemy Netcompany za zaufanie i wiarę w to, co robimy!",
    offsetX: -5,
    offsetY: 3,
  },
  {
    id: "partner-4",
    name: "Comtegra",
    logo: comtegraLogo,
    description:
      "Comtegra to polska firma z ponad 25-letnim doświadczeniem w integracji systemów IT, specjalizująca się w budowie i utrzymaniu zaawansowanej infrastruktury informatycznej. W swojej ofercie łączy rozwiązania z zakresu cloud computingu, cyberbezpieczeństwa, zarządzania danymi oraz sztucznej inteligencji. Obsługują zarówno biznes, jak i instytucje naukowe.\n\nOd listopada 2024 roku Comtegra wspiera Samorząd Przyszłości PJATK, udostępniając platformę Comtegra Enterprise Cloud. Tym samym dostarczając infrastrukturę informatyczną niezbędną do realizacji projektów badawczych oraz narzędzia napędzające codzienne działania samorządu. To wsparcie realnie przekłada się na jakość i skalę tego, co tworzymy dla naszej społeczności.\n\nDziękujemy Comtegrze za zaufanie i nieocenione wsparcie technologiczne!",
    offsetY: 3,
  },
];

export { PARTNERS };

export function PartnersSection() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Partners</Text>
      <View style={styles.row}>
        {PARTNERS.map((partner) => (
          <TouchableOpacity
            key={partner.id}
            style={styles.slot}
            activeOpacity={0.6}
            onPress={() =>
              router.push(`/trips/partners/${partner.id}` as const)
            }
          >
            <Image
              source={partner.logo}
              style={[
                styles.logo,
                partner.height ? { height: partner.height } : undefined,
                partner.offsetX || partner.offsetY
                  ? {
                      transform: [
                        { translateX: partner.offsetX ?? 0 },
                        { translateY: partner.offsetY ?? 0 },
                      ],
                    }
                  : undefined,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: typography.xs - 1,
    fontWeight: typography.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: "100%",
  },
  slot: {
    flex: 1,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
